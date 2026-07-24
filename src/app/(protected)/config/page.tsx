"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import CategoryForm from "@/components/forms/CategoryForm";
import type { Category } from "@/lib/services/categories";

export default function ConfigPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const supabase = createClient();

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("nome");
    if (data) setCategories(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleEdit = (cat: Category) => {
    setEditingCat(cat);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta categoria? Transações vinculadas não serão afetadas.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (!error) refresh();
  };

  const handleFormSuccess = () => {
    setModalOpen(false);
    setEditingCat(null);
    refresh();
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-white">Configurações</h1>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Categorias
          </h2>
          <Button
            onClick={() => {
              setEditingCat(null);
              setModalOpen(true);
            }}
            size="sm"
          >
            <Plus size={16} />
            Nova
          </Button>
        </div>

        {loading ? (
          <LoadingSpinner className="py-8" />
        ) : categories.length === 0 ? (
          <EmptyState
            title="Nenhuma categoria cadastrada"
            description="Crie categorias para organizar suas receitas e despesas."
          />
        ) : (
          <div className="space-y-2">
            <div className="text-xs font-medium text-zinc-500 mb-2">Receitas</div>
            {categories
              .filter((c) => c.tipo === "receita")
              .map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: cat.cor ?? "#6b7280" }}
                    />
                    <span className="text-sm text-white">{cat.nome}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="rounded-lg p-1 text-zinc-500 hover:bg-red-900/30 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

            <div className="text-xs font-medium text-zinc-500 mb-2 mt-4 pt-4 border-t border-zinc-800">
              Despesas
            </div>
            {categories
              .filter((c) => c.tipo === "despesa")
              .map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: cat.cor ?? "#6b7280" }}
                    />
                    <span className="text-sm text-white">{cat.nome}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="rounded-lg p-1 text-zinc-500 hover:bg-red-900/30 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="text-sm font-semibold text-zinc-300">Perfil</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Edição de perfil disponível em breve.
        </p>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCat(null);
        }}
        title={editingCat ? "Editar categoria" : "Nova categoria"}
      >
        <CategoryForm
          category={editingCat}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setModalOpen(false);
            setEditingCat(null);
          }}
        />
      </Modal>
    </div>
  );
}
