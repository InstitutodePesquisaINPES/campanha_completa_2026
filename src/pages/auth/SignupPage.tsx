import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, Lock, Mail, ArrowRight, User } from "lucide-react";
import { motion } from "framer-motion";

const signupSchema = z.object({
  fullName: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const handleSignup = async (data: SignupForm) => {
    setLoading(true);
    try {
      const res = await api.post<{ token: string }>('/auth/register', data);
      api.setToken(res.token);
      await refreshUser();
      toast({ title: "Bem-vindo ao Comando!", description: "Sua operação foi inicializada com sucesso." });
      navigate("/");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro no Cadastro", description: error.message || "Erro desconhecido. Tente novamente." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
      
      {/* Lado Esquerdo - Painel de Marca (Visível em Desktop) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-gradient-to-br from-slate-900 to-slate-800 p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-2000"></div>
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="text-3xl font-black tracking-tighter">Kiribamba<span className="text-blue-400">.</span></span>
        </div>
        
        <div className="relative z-10 max-w-lg">
          <h1 className="text-5xl font-bold mb-6 leading-tight">Inicie sua Operação Territorial.</h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            Abra seu novo QG digital. Ao se cadastrar, criaremos automaticamente um Tenant (Workspace) isolado e criptografado para a sua campanha.
          </p>
        </div>
        
        <div className="relative z-10 text-sm text-slate-500 font-medium">
          © {new Date().getFullYear()} Kiribamba Enterprise. Todos os direitos reservados.
        </div>
      </div>

      {/* Lado Direito - Formulário de Cadastro */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-tl from-emerald-50 to-transparent dark:from-slate-900 dark:to-transparent opacity-50 z-0"></div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Logo Mobile */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Shield className="h-5 w-5" />
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-white">Kiribamba</span>
          </div>

          <div className="glass-card rounded-3xl p-8 shadow-2xl border border-white/50 dark:border-slate-800/50">
            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Criar nova conta</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Configure o perfil do administrador (Comandante).</p>
            </div>

            <form onSubmit={handleSubmit(handleSignup)} className="space-y-5">
              
              <div className="space-y-2 relative">
                <Label htmlFor="name" className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Nome Completo</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <Input
                    id="name"
                    placeholder="Comandante Supremo"
                    {...register("fullName")}
                    disabled={loading}
                    className="pl-10 h-12 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl focus-visible:ring-blue-500 transition-all"
                  />
                </div>
                {errors.fullName && <p className="text-sm text-red-500 mt-1">{errors.fullName.message}</p>}
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="email" className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">E-mail</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    {...register("email")}
                    disabled={loading}
                    className="pl-10 h-12 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl focus-visible:ring-blue-500 transition-all"
                  />
                </div>
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="password" className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Senha (Mín. 6 caracteres)</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register("password")}
                    disabled={loading}
                    className="pl-10 h-12 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl focus-visible:ring-blue-500 transition-all"
                  />
                </div>
                {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
              </div>

              <Button type="submit" className="w-full h-12 text-md font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all group" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                {loading ? 'Preparando QG...' : 'Criar Operação'}
                {!loading && <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Já possui uma operação em andamento?{" "}
              <Link to="/login" className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Fazer Login
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
