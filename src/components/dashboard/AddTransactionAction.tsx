import Link from 'next/link';
import { PlusCircle } from 'react-feather';
import { Button } from "@chakra-ui/react";

export default function AddTransactionAction() {
    return (
        <Button asChild colorPalette="primary">
            <Link href="/transaction">
                <PlusCircle size={18} />
                Nova Transação
            </Link>
        </Button>
    );
}
