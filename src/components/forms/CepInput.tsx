import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin } from "lucide-react";
import { fetchCep, type ViaCepAddress } from "@/lib/api/viacep";

interface CepInputProps {
  value?: string;
  onChange?: (cep: string) => void;
  onAddressFound?: (address: ViaCepAddress) => void;
  label?: string;
  id?: string;
}

export function CepInput({ value = "", onChange, onAddressFound, label = "CEP", id = "cep" }: CepInputProps) {
  const [loading, setLoading] = useState(false);
  const [internalValue, setInternalValue] = useState(value);

  const formatted = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 8);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  };

  const handleChange = async (raw: string) => {
    const masked = formatted(raw);
    setInternalValue(masked);
    onChange?.(masked);
    const digits = masked.replace(/\D/g, "");
    if (digits.length === 8 && onAddressFound) {
      setLoading(true);
      const data = await fetchCep(digits);
      setLoading(false);
      if (data) onAddressFound(data);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id={id}
          value={internalValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="00000-000"
          className="pl-9 pr-9"
          maxLength={9}
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
      </div>
    </div>
  );
}
