import { useLocalSearchParams } from 'expo-router';
import { ContractForm } from '@/components/contracts/ContractForm';
export default function NewContract() { const { client_id } = useLocalSearchParams<{ client_id?: string }>(); return <ContractForm clientId={client_id} />; }
