"use client"
import { useState } from 'react';
import { Zap } from 'react-feather';
import { IconButton } from '@chakra-ui/react';
import QuickEntryDialog from '@/components/transaction/QuickEntryDialog';

export default function FloatingActionButton() {
    const [quickEntryOpen, setQuickEntryOpen] = useState(false);

    return (
        <>
            <IconButton
                aria-label="Texto rápido"
                title="Texto rápido"
                colorPalette="primary"
                rounded="full"
                boxSize="56px"
                shadow="lg"
                position="fixed"
                // Clears the home indicator on phones with a safe-area inset.
                bottom="calc(16px + env(safe-area-inset-bottom))"
                right="calc(16px + env(safe-area-inset-right))"
                zIndex="docked"
                onClick={() => setQuickEntryOpen(true)}
            >
                <Zap size={24} />
            </IconButton>
            <QuickEntryDialog open={quickEntryOpen} onClose={() => setQuickEntryOpen(false)} />
        </>
    );
}
