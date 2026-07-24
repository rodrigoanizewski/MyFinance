"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import type { FixedAsset } from "@/lib/services/fixedAssets";

interface FixedAssetFormProps {
  asset?: FixedAsset | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function FixedAssetForm({ asset, onSuccess, onCancel }: FixedAssetFormProps) {
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("imovel");
  const [valorEstimado, setValorEstimado] = useState("");
  const [valorCompra, setValorCompra] = useState("");
  const [dataCompra, setDataCompra] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (asset) {
      setNome(asset.nome);
      setCategoria(asset.categoria);
      setValorEstimado(asset.valor_estimado ? String(asset.valor_estimado) : "");
      setValorCompra(asset.valor_compra ? String(asset.valor_compra) : "");
      setDataCompra(asset.data_compra ?? "");
    }
  }, [asset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const ve = valorEstimado ? parseFloat(valorEstimado.replace(",", ".")) : null;
    const vc = valorCompra ? parseFloat(valorCompra.replace(",", ".")) : null;

    const payload = {
      nome,
      categoria,
      valor_estimado: ve,
      valor_compra: vc,
      data_compra: dataCompra || null,
    };

    const { data: user } = await supabase.auth.getUser();

    if (asset) {
      const { error: err } = await supabase.from("fixed_assets").update(payload).eq("id", asset.id);
      if (err) setError(err.message);
    } else {
      const { error: err } = await supabase.from("fixed_assets").insert({ ...payload, user_id: user.user!.id });
      if (err) setError(err.message);
    }

    setSaving(false);
    if (!error) onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input id="nome" label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Ex: Apartamento, Carro..." />
      <Select
        id="cat"
        label="Categoria"
        value={categoria}
        onChange={(e) => setCategoria(e.target.value)}
        options={[
          { value: "imovel", label: "Imóvel" },
          { value: "veiculo", label: "Veículo" },
          { value: "outro", label: "Outro" },
        ]}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input id="ve" label="Valor estimado" value={valorEstimado} onChange={(e) => setValorEstimado(e.target.value)} placeholder="0,00" />
        <Input id="vc" label="Valor de compra" value={valorCompra} onChange={(e) => setValorCompra(e.target.value)} placeholder="0,00" />
      </div>
      <Input id="dc" label="Data de compra" type="date" value={dataCompra} onChange={(e) => setDataCompra(e.target.value)} />
      {error && <p className="rounded-lg bg-red-900/30 p-3 text-sm text-red-400">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Salvando..." : asset ? "Atualizar" : "Adicionar"}</Button>
      </div>
    </form>
  );
}
