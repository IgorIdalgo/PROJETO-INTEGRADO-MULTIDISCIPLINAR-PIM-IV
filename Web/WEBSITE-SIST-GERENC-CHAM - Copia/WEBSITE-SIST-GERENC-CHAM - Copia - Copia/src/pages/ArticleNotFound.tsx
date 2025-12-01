
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export default function ArticleNotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <FileText size={64} className="text-muted-foreground mb-4" />
      <h1 className="text-3xl font-bold mb-2">Artigo não encontrado</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        O artigo que você está procurando não existe ou foi removido da base de conhecimento.
      </p>
      <div className="flex space-x-4">
        <Button onClick={() => navigate("/knowledge-base")}>
          Explorar Base de Conhecimento
        </Button>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Voltar
        </Button>
      </div>
    </div>
  );
}
