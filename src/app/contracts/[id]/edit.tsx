import { useLocalSearchParams } from 'expo-router';
import { ContractForm } from '@/components/contracts/ContractForm';
export default function EditContract() { const { id } = useLocalSearchParams<{ id: string }>(); return <ContractForm id={id} />; }
