import { ReactNode } from "react";
import { Box, Card, Flex, Heading, Text } from "@chakra-ui/react";

interface DashboardSummaryCardProps {
    title: string;
    value: string;
    icon: ReactNode;
    colorClass: string;
    subtitle?: string;
}

export default function DashboardSummaryCard({ title, value, icon, colorClass, subtitle }: DashboardSummaryCardProps) {
    return (
        <Card.Root h="full">
            <Card.Body>
                <Flex align="center" gap={3} mb={3}>
                    <Box bg={`status.${colorClass}.subtle`} color={`status.${colorClass}`} p={3} borderRadius="md" flexShrink={0}>
                        {icon}
                    </Box>
                    <Box flex={1}>
                        <Text fontSize="sm" fontWeight="semibold" color="fg.muted">{title}</Text>
                        <Heading size="lg" mt={1}>{value}</Heading>
                    </Box>
                </Flex>
                {subtitle && <Text fontSize="sm" color="fg.muted">{subtitle}</Text>}
            </Card.Body>
        </Card.Root>
    );
}
