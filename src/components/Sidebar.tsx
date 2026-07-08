"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, CreditCard, DollarSign, Grid, Home, List, Menu, PieChart, ShoppingBag, Target, Users, X } from 'react-feather'
import { Box, Drawer, Flex, IconButton, Text, useDisclosure } from '@chakra-ui/react'

type NavItem = { href: string; label: string; icon: typeof Home }
type NavSection = { title: string; items: NavItem[] }

const navSections: NavSection[] = [
    {
        title: 'GERAL',
        items: [
            { href: '/', label: 'Home', icon: Home },
            { href: '/transaction', label: 'Transações', icon: DollarSign },
        ],
    },
    {
        title: 'CADASTROS',
        items: [
            { href: '/category', label: 'Categorias', icon: List },
            { href: '/subcategory', label: 'Subcategorias', icon: Grid },
            { href: '/account', label: 'Contas', icon: CreditCard },
            { href: '/budget', label: 'Orçamentos', icon: PieChart },
            { href: '/savings-goal', label: 'Metas de Poupança', icon: Target },
            { href: '/shared-expense-group', label: 'Despesas Compartilhadas', icon: Users },
        ],
    },
    {
        title: 'RELATÓRIOS',
        items: [
            { href: '/financial-health', label: 'Saúde Financeira', icon: Activity },
            { href: '/wishlist', label: 'Lista de Desejos', icon: ShoppingBag },
        ],
    },
]

function BrandHeader() {
    return (
        <Flex align="center" gap={2} px={4} py={5}>
            <Box bg="brand.primary" color="white" borderRadius="md" p={2} display="flex" alignItems="center" justifyContent="center">
                <Activity size={18} />
            </Box>
            <Text fontWeight="bold" color="text.heading" fontSize="lg">e-TKN Fin Lite</Text>
        </Flex>
    )
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
    return (
        <Box px={3}>
            {navSections.map((section) => (
                <Box key={section.title} mb={4}>
                    <Text
                        fontSize="xs"
                        fontWeight="semibold"
                        color="text.muted"
                        textTransform="uppercase"
                        letterSpacing="wide"
                        px={2}
                        mb={2}
                    >
                        {section.title}
                    </Text>
                    <Box>
                        {section.items.map(({ href, label, icon: Icon }) => {
                            const active = pathname === href
                            return (
                                <Link key={href} href={href} onClick={onNavigate}>
                                    <Flex
                                        align="center"
                                        gap={2}
                                        px={2}
                                        py={2}
                                        mb={1}
                                        borderRadius="md"
                                        color={active ? 'brand.primary' : 'text.muted'}
                                        bg={active ? 'brand.primary.subtle' : 'transparent'}
                                        _hover={{ color: active ? 'brand.primary' : 'text.heading' }}
                                    >
                                        <Icon size={18} />
                                        <Text fontSize="sm">{label}</Text>
                                    </Flex>
                                </Link>
                            )
                        })}
                    </Box>
                </Box>
            ))}
            {/* TODO: user profile footer once real auth/session data exists */}
        </Box>
    )
}

export default function Sidebar() {
    const pathname = usePathname()
    const { open, onOpen, onClose } = useDisclosure()

    return (
        <>
            <Box
                as="aside"
                position="fixed"
                top={0}
                left={0}
                h="100vh"
                w="sidebar"
                bg="sidebar.bg"
                borderRight="1px solid"
                borderColor="sidebar.border"
                display={{ base: 'none', md: 'block' }}
                overflowY="auto"
            >
                <BrandHeader />
                <NavLinks pathname={pathname} />
            </Box>

            <Flex
                display={{ base: 'flex', md: 'none' }}
                align="center"
                justify="space-between"
                position="sticky"
                top={0}
                zIndex="docked"
                bg="sidebar.bg"
                borderBottom="1px solid"
                borderColor="sidebar.border"
                px={2}
                py={2}
            >
                <Flex align="center" gap={2} px={2}>
                    <Box bg="brand.primary" color="white" borderRadius="md" p={1.5} display="flex" alignItems="center" justifyContent="center">
                        <Activity size={16} />
                    </Box>
                    <Text fontWeight="bold" color="text.heading">e-TKN Fin Lite</Text>
                </Flex>
                <IconButton aria-label="Abrir menu" variant="ghost" onClick={onOpen}>
                    <Menu size={20} />
                </IconButton>
            </Flex>

            <Drawer.Root open={open} onOpenChange={(details) => (details.open ? onOpen() : onClose())} placement="start">
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content bg="sidebar.bg" maxW="sidebar">
                        <Flex justify="space-between" align="center">
                            <BrandHeader />
                            <Drawer.CloseTrigger asChild>
                                <IconButton aria-label="Fechar menu" variant="ghost" mr={2}>
                                    <X size={20} />
                                </IconButton>
                            </Drawer.CloseTrigger>
                        </Flex>
                        <Drawer.Body px={0}>
                            <NavLinks pathname={pathname} onNavigate={onClose} />
                        </Drawer.Body>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Drawer.Root>
        </>
    )
}
