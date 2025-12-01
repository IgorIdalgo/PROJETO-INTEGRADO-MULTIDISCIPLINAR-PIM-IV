
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { KnowledgeArticle, UserRole } from "@/types";
import { apiGet } from "@/lib/api";
import { ArrowLeft, Calendar, User, FileText, Loader2, Share2, Copy, Check } from "lucide-react";

// Simple markdown renderer
const renderMarkdown = (markdown: string) => {
  const html = markdown
    // Headers
    .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold my-6 text-gray-900">$1</h1>')
    .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold my-4 text-gray-800 mt-6">$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold my-3 text-gray-700 mt-4">$1</h3>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    // Italic
    .replace(/\_(.*?)\_/g, '<em class="italic">$1</em>')
    // Code blocks (backticks)
    .replace(/`(.*?)`/g, '<code class="bg-gray-100 text-red-600 px-2 py-1 rounded text-sm font-mono">$1</code>')
    // Unordered lists
    .replace(/^\- (.*$)/gm, '<li class="ml-6 list-disc my-2">$1</li>')
    // Ordered lists (basic)
    .replace(/^\d\. (.*$)/gm, '<li class="ml-6 list-decimal my-2">$1</li>')
    // Paragraphs
    .replace(/^(?!<[hl]|<li|<code)(.*$)/gm, function(m) {
      return m.trim() === '' ? '' : '<p class="my-4 text-gray-700 leading-relaxed">'+m+'</p>';
    })
    // Remove empty paragraphs
    .replace(/<p><\/p>/g, '');

  return { __html: html };
};

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [article, setArticle] = useState<KnowledgeArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Fetch article data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        console.warn("No article ID provided");
        setIsLoading(false);
        return;
      }
      
      try {
        console.log(`Fetching article with ID: ${id}`);
        const data = await apiGet(`/api/artigos/${id}`);
        if (data) {
          const mappedArticle: KnowledgeArticle = {
            id: String(data.id || id),
            title: data.titulo || data.title,
            content: data.conteudo || data.content,
            category: data.categoria || data.category || 'hardware',
            tags: data.tags || [],
            authorId: data.id_autor || data.authorId,
            authorName: data.nome_autor || data.authorName || 'Autor',
            createdAt: new Date(data.createdAt || Date.now()),
            updatedAt: new Date(data.updatedAt || Date.now()),
          };
          console.log("Article loaded successfully:", mappedArticle);
          setArticle(mappedArticle);
        } else {
          console.warn("No article data returned from API");
        }
      } catch (error) {
        console.error("Error fetching article:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-teal-50 overflow-hidden pt-14 md:pt-16 md:ml-16 lg:ml-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Carregando artigo...</p>
        </div>
      </div>
    );
  }

  if (!article || !id) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-teal-50 overflow-hidden pt-14 md:pt-16 md:ml-16 lg:ml-20 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="p-4 bg-red-100 rounded-full w-fit mx-auto mb-4">
            <FileText size={48} className="text-red-600" />
          </div>
          <h3 className="text-2xl font-bold mb-2 text-gray-900">Artigo não encontrado</h3>
          <p className="text-gray-600 mb-2">O artigo solicitado não existe ou foi removido.</p>
          <p className="text-xs text-gray-500 mb-6">{id ? `ID: ${id}` : 'Nenhum ID fornecido'}</p>
          <Button 
            onClick={() => navigate('/knowledge-base')}
            className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white h-11 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            <ArrowLeft size={18} className="mr-2" />
            Voltar à Base de Conhecimento
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-teal-50 overflow-hidden pt-14 md:pt-16 md:ml-16 lg:ml-20">
      {/* Decorative background elements */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-teal-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-teal-200/20 to-blue-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative w-full h-full flex flex-col p-4 md:p-8 overflow-hidden">
        <div className="max-w-4xl w-full mx-auto flex flex-col h-full overflow-auto gap-6">
          
          {/* Back Button */}
          <div className="flex-shrink-0">
            <Button 
              variant="outline" 
              onClick={() => navigate('/knowledge-base')}
              className="border-2 border-gray-200 hover:bg-white hover:border-teal-400 text-gray-700 h-10 px-4 rounded-lg transition-all flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Voltar à Base de Conhecimento
            </Button>
          </div>

          {/* Article Header */}
          <Card className="flex-shrink-0 border-0 shadow-lg bg-white/95 backdrop-blur-sm overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 to-blue-600 h-2" />
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <Badge 
                      className="bg-teal-100 text-teal-700 border-teal-200 capitalize px-3 py-1 text-xs font-semibold"
                      variant="outline"
                    >
                      {article.category}
                    </Badge>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <FileText size={14} />
                      <span>ID: {article.id}</span>
                    </div>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                    {article.title}
                  </h1>
                </div>
                {(user?.role === UserRole.TECHNICIAN || user?.role === UserRole.ADMINISTRATOR) && (
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/edit-article/${article.id}`)}
                    className="border-2 border-gray-200 hover:bg-teal-50 hover:border-teal-400 text-gray-700 h-10 px-4 rounded-lg whitespace-nowrap"
                  >
                    Editar
                  </Button>
                )}
              </div>

              {/* Metadata */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 text-sm text-gray-600 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <User size={16} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Autor</p>
                    <p className="font-semibold text-gray-900">{article.authorName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Calendar size={16} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Atualizado</p>
                    <p className="font-semibold text-gray-900">{new Date(article.updatedAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Article Content */}
          <Card className="flex-1 border-0 shadow-lg bg-white/95 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-6 md:p-8 h-full overflow-y-auto">
              <div 
                className="prose prose-blue max-w-none text-gray-800"
                dangerouslySetInnerHTML={renderMarkdown(article.content)} 
              />
            </CardContent>
          </Card>

          {/* Tags and Actions Footer */}
          <Card className="flex-shrink-0 border-0 shadow-lg bg-white/95 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                  {article.tags.length > 0 && (
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-semibold text-gray-700">Tags:</span>
                      {article.tags.map((tag, index) => (
                        <Badge 
                          key={index}
                          variant="secondary"
                          className="bg-blue-100 text-blue-700 px-3 py-1 text-xs font-medium"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="border-2 border-gray-200 hover:bg-gray-50 hover:border-blue-400 text-gray-700 rounded-lg h-10 px-3 flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check size={16} className="text-green-600" />
                        <span className="text-xs">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span className="text-xs">Copiar Link</span>
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="border-2 border-gray-200 hover:bg-gray-50 hover:border-blue-400 text-gray-700 rounded-lg h-10 px-3 flex items-center gap-2"
                  >
                    <Share2 size={16} />
                    <span className="text-xs">Compartilhar</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

