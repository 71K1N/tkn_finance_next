import Link from 'next/link';
import { PlusCircle } from 'react-feather';

export default function AddTransactionAction() {
    return (
        <Link href="/transaction" className="btn btn-primary d-inline-flex align-items-center gap-2">
            <PlusCircle size={18} />
            Nova Transação
        </Link>
    );
}
