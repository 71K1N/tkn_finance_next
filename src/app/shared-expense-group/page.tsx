"use client"
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Save, X, Archive } from 'react-feather';
import swal from 'sweetalert';
import { Button, DataTable, type DataTableColumn, type DataTableAction, type DataTableHandle } from "tikin-ds";
import { Badge, Box, Card, Container, Field, Heading, Input, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { archiveExpenseGroup, createExpenseGroup, getExpenseGroups } from "@/lib/api/shared-expense-group";
import type { ExpenseGroup } from "@/lib/types/shared-expense-group";

export default function PageSharedExpenseGroup() {
    const router = useRouter();
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [errors, setErrors] = useState<{ name?: string }>({});
    const tableRef = useRef<DataTableHandle>(null);

    function validateForm() {
        const newErrors: { name?: string } = {};
        if (!name.trim()) newErrors.name = "Nome é obrigatório";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    function clearForm() {
        setName("");
        setDescription("");
        setErrors({});
    }

    async function store() {
        if (!validateForm()) return;
        setLoading(true);
        try {
            await createExpenseGroup({ name, description: description || undefined });
            swal("Sucesso!", "Grupo criado com sucesso!", "success");
            clearForm();
            tableRef.current?.refetch();
        } catch (error) {
            swal("Erro!", "Não foi possível criar o grupo", "error");
        } finally {
            setLoading(false);
        }
    }

    function archive(item: ExpenseGroup) {
        swal({
            title: "Confirmação",
            text: "Tem certeza que deseja arquivar este grupo?",
            icon: "warning",
            dangerMode: true,
            buttons: ["Cancelar", "Arquivar"],
        }).then(async (willArchive) => {
            if (willArchive) {
                setLoading(true);
                try {
                    await archiveExpenseGroup(item.id);
                    swal("Sucesso!", "Grupo arquivado com sucesso!", "success");
                    tableRef.current?.refetch();
                } catch (error) {
                    swal("Erro!", "Não foi possível arquivar o grupo", "error");
                } finally {
                    setLoading(false);
                }
            }
        });
    }

    function open(item: ExpenseGroup) {
        router.push(`/shared-expense-group/${item.id}`);
    }

    const columns: DataTableColumn<ExpenseGroup>[] = [
        { key: "name", header: "Nome", sortable: true },
        { key: "description", header: "Descrição", render: (row) => row.description ?? "-" },
        {
            key: "members",
            header: "Membros",
            render: (row) => row.members.filter((m) => m.active).length,
        },
        {
            key: "is_active",
            header: "Status",
            render: (row) => (
                <Badge colorPalette={row.is_active ? "green" : "gray"}>
                    {row.is_active ? "Ativo" : "Arquivado"}
                </Badge>
            ),
        },
    ];

    const actions: DataTableAction<ExpenseGroup>[] = [
        { label: "Abrir", icon: <ExternalLink size={16} />, onClick: open },
        { label: "Arquivar", icon: <Archive size={16} />, variant: "danger", onClick: archive, isDisabled: (row) => !row.is_active },
    ];

    return (
        <Container maxW="6xl" py={8}>
            <Box mb={6}>
                <Heading size="5xl">Despesas Compartilhadas</Heading>
                <Text color="fg.muted">Crie grupos para dividir despesas com outras pessoas, como &ldquo;Despesas da Casa&rdquo;</Text>
            </Box>

            <Card.Root mb={6}>
                <Card.Body>
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                        <Field.Root invalid={!!errors.name}>
                            <Field.Label>Nome</Field.Label>
                            <Input
                                value={name}
                                placeholder="Ex: Despesas da Casa"
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if (errors.name) setErrors({ ...errors, name: undefined });
                                }}
                            />
                            {errors.name && <Field.ErrorText>{errors.name}</Field.ErrorText>}
                        </Field.Root>
                        <Field.Root>
                            <Field.Label>Descrição</Field.Label>
                            <Input
                                value={description}
                                placeholder="Opcional"
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </Field.Root>
                    </SimpleGrid>
                    <Stack direction="row" gap={2} mt={4}>
                        <Button colorPalette="primary" onClick={store} disabled={loading}>
                            <Save size={16} />
                            Criar grupo
                        </Button>
                        <Button variant="outline" onClick={clearForm} disabled={loading}>
                            <X size={16} />
                            Cancelar
                        </Button>
                    </Stack>
                </Card.Body>
            </Card.Root>

            <Card.Root>
                <Card.Body>
                    <DataTable<ExpenseGroup>
                        ref={tableRef}
                        columns={columns}
                        actions={actions}
                        rowKey={(row) => row.id}
                        enableSearch
                        searchPlaceholder="Buscar grupos..."
                        emptyMessage="Nenhum grupo encontrado"
                        errorMessage="Não foi possível carregar os grupos"
                        onDataLoading={getExpenseGroups}
                    />
                </Card.Body>
            </Card.Root>
        </Container>
    )
}
