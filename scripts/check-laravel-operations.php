<?php

// Isolated API smoke test: SQLite in memory, no demo or production records changed.
$backend = dirname(__DIR__, 2).'/locafy';
require $backend.'/vendor/autoload.php';
$app = require $backend.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
set_exception_handler(function (Throwable $error): void { fwrite(STDERR, 'FAIL: '.$error->getMessage()."\n"); exit(1); });
config(['app.env' => 'testing', 'database.default' => 'sqlite', 'database.connections.sqlite.database' => ':memory:', 'database.connections.sqlite.url' => null, 'cache.default' => 'array', 'session.driver' => 'array']);
Illuminate\Support\Facades\DB::purge('sqlite');
Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
Carbon\CarbonImmutable::setTestNow(Carbon\CarbonImmutable::parse('2026-10-07T21:00:00Z'));
Carbon\Carbon::setTestNow(Carbon\CarbonImmutable::parse('2026-10-07T21:00:00Z'));
$company = App\Models\Company::factory()->create();
$user = App\Models\User::factory()->for($company)->create();
$client = App\Models\Client::factory()->for($company)->create();
$product = App\Models\Product::factory()->for($company)->create();
$token = $user->createToken('isolated-smoke')->plainTextToken;
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$checks = 0;
function smokeCheck(bool $ok, string $message): void { global $checks; if (!$ok) throw new RuntimeException($message); $checks++; }
function smokeRequest(string $method, string $path, array $body = [], int $expected = 200): array {
    global $kernel, $token;
    $request = Illuminate\Http\Request::create('/api/v1/'.$path, $method, [], [], [], ['HTTP_ACCEPT' => 'application/json', 'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer '.$token], json_encode($body));
    $response = $kernel->handle($request);
    $json = json_decode($response->getContent(), true);
    smokeCheck($response->getStatusCode() === $expected, "$method $path: ".$response->getStatusCode().' '.json_encode($json));
    return $json['data'] ?? $json;
}
$contract = smokeRequest('POST', 'contracts', ['client_id' => $client->id, 'started_at' => '2026-10-05T12:00:00-03:00', 'charge_saturdays' => true, 'next_charge_date' => '2026-10-07', 'items' => [['product_id' => $product->id, 'billing_period' => 'DAY', 'unit_price' => '10.00', 'initial_quantity' => 2]]], 201);
$id = $contract['id']; $item = $contract['items'][0]['id'];
smokeCheck($contract['status'] === 'ACTIVE', 'Created contract must be ACTIVE');
smokeRequest('PATCH', "contracts/$id", ['notes' => 'API smoke']);
$freight = smokeRequest('POST', "contracts/$id/freights", ['quantity' => 1, 'unit_amount' => '5.00', 'occurred_at' => '2026-10-05T13:00:00-03:00'], 201);
smokeRequest('PATCH', "contracts/$id/freights/{$freight['id']}", ['quantity' => 2, 'unit_amount' => '5.00', 'notes' => 'Edited']);
foreach ([['2026-10-06T14:00:00-03:00', 'ACTIVE'], ['2026-10-07T09:00:00-03:00', 'RETURNED']] as [$date, $status]) {
    smokeRequest('POST', "contracts/$id/movements", ['type' => 'RETURN', 'occurred_at' => $date, 'items' => [['contract_item_id' => $item, 'quantity' => 1]]], 201);
    $contract = smokeRequest('GET', "contracts/$id");
    smokeCheck($contract['status'] === $status, 'Contract status after return');
}
smokeCheck($contract['display_status_label'] === 'Pendente de pagamento', 'Returned contract pending payment');
smokeRequest('POST', "contracts/$id/finalize", [], 422);
smokeRequest('POST', "contracts/$id/payments", ['amount' => '1.00', 'paid_at' => '2026-10-07T15:00:00-03:00', 'method' => 'PIX']);
$contract = smokeRequest('GET', "contracts/$id");
smokeCheck(!$contract['can_finalize'], 'Partial payment must remain pending');
smokeRequest('POST', "contracts/$id/payments", ['amount' => $contract['financial_balance'], 'paid_at' => '2026-10-07T16:00:00-03:00', 'method' => 'CASH']);
$contract = smokeRequest('GET', "contracts/$id");
smokeCheck($contract['status'] === 'RETURNED' && $contract['can_finalize'] && $contract['financial_balance'] === '0.00', 'Paid contract must be ready and not finalized automatically');
smokeCheck(count(smokeRequest('GET', 'charges?filter=outstanding')) === 0, 'Settled contract leaves pending charges');
smokeRequest('POST', "contracts/$id/finalize");
smokeCheck(smokeRequest('GET', "contracts/$id")['status'] === 'FINALIZED', 'Finalization must persist');
smokeRequest('POST', "contracts/$id/movements", ['type' => 'WITHDRAWAL', 'occurred_at' => '2026-10-07T17:00:00-03:00', 'items' => [['contract_item_id' => $item, 'quantity' => 1]]], 422);
smokeRequest('POST', "contracts/$id/freights", ['quantity' => 1, 'unit_amount' => '5.00', 'occurred_at' => '2026-10-07T17:00:00-03:00'], 422);
smokeRequest('POST', "contracts/$id/finalize", [], 422);
echo "PASS: $checks real Laravel API checks; contract creation/edit, freight, final return, payment, finalization and closed-contract guards.\n";
