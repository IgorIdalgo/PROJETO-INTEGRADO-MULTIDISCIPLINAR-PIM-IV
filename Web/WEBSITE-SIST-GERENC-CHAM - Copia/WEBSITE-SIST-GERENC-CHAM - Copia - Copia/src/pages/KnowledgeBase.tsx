
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KnowledgeArticle, TicketCategory, UserRole } from "@/types";
import { apiGet } from "@/lib/api";
import { Search, PlusCircle, FileText, Loader2, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function KnowledgeBase() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<KnowledgeArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch knowledge base articles
  useEffect(() => {
    const loadArticles = async () => {
      try {
        const allArticles = await apiGet('/api/artigos');
        const articlesList = Array.isArray(allArticles) ? allArticles.map((a: any, idx: number) => {
          const articleId = String(a.id || a.idArtigo || a.idartigo || `article-${idx}`);
          return {
            id: articleId,
            title: a.titulo || a.title,
            content: a.conteudo || a.content,
            category: a.categoria || a.category || 'hardware',
            tags: a.tags || [],
            authorId: a.id_autor || a.authorId,
            authorName: a.nome_autor || a.authorName || 'Autor',
            createdAt: new Date(a.createdAt || Date.now()),
            updatedAt: new Date(a.updatedAt || Date.now()),
          };
        }) : [];
        setArticles(articlesList);
        setFilteredArticles(articlesList);
      } catch (error) {
        console.error("Failed to load knowledge base articles:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadArticles();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = articles;

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query) ||
        article.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredArticles(result);
  }, [searchQuery, articles]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-teal-50 overflow-hidden pt-14 md:pt-16 md:ml-16 lg:ml-20">
      {/* Decorative elements */}
      <div className="absolute top-14 md:top-16 right-0 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-teal-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-teal-200/20 to-blue-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative w-full h-full flex flex-col p-4 md:p-8 overflow-hidden">
        <div className="max-w-7xl w-full mx-auto flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-100 rounded-lg">
                <BookOpen size={28} className="text-teal-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Base de Conhecimento</h1>
                <p className="text-sm text-gray-600 mt-1">Encontre soluções e artigos úteis</p>
              </div>
            </div>
            {(user?.role === UserRole.TECHNICIAN || user?.role === UserRole.ADMINISTRATOR) && (
              <Button 
                onClick={() => navigate("/new-article")}
                className="h-11 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2"
              >
                <PlusCircle size={18} />
                Novo Artigo
              </Button>
            )}
          </div>

          {/* Search and Filters */}
          <Card className="mb-8 border-0 shadow-lg bg-white/95 backdrop-blur-sm flex-shrink-0">
            <CardContent className="p-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Buscar artigos por título, conteúdo ou tags..."
                  className="pl-10 h-11 border-2 border-gray-200 focus:border-teal-500 rounded-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Articles Grid */}
          <div className="flex-1 overflow-auto pr-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-teal-600 mx-auto mb-4" />
                  <p className="text-gray-600">Carregando base de conhecimento...</p>
                </div>
              </div>
            ) : filteredArticles.length > 0 ? (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-max">
                {filteredArticles.map((article) => (
                  <Card
                    key={article.id}
                    className="cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-white/95 backdrop-blur-sm overflow-hidden group"
                    onClick={() => navigate(`/knowledge-base/${article.id}`)}
                  >
                    <div className="bg-gradient-to-r from-teal-500 to-teal-600 h-1 group-hover:h-1.5 transition-all" />
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-teal-100 rounded-lg group-hover:bg-teal-200 transition-all">
                          <FileText size={20} className="text-teal-600" />
                        </div>
                        <Badge 
                          variant="outline" 
                          className="capitalize bg-teal-50 text-teal-700 border-teal-200"
                        >
                          {article.category}
                        </Badge>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-teal-600 transition-colors">
                        {article.title}
                      </h3>
                      
                      <div className="text-sm text-gray-600 line-clamp-3 mb-4">
                        {article.content
                          .replace(/#/g, '')
                          .split('\n')
                          .filter((line: string) => line.trim() !== '')
                          [0]
                          ?.trim()}
                      </div>

                      {article.tags.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-2">
                          {article.tags.slice(0, 3).map((tag, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="text-xs bg-gray-100 text-gray-700"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {article.tags.length > 3 && (
                            <Badge 
                              variant="secondary" 
                              className="text-xs bg-gray-100 text-gray-700"
                            >
                              +{article.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="border-t border-gray-200 pt-3 flex justify-between items-center text-xs text-gray-500">
                        <span>Por {article.authorName}</span>
                        <span>{new Date(article.updatedAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center">
                  <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                    <FileText size={48} className="text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum artigo encontrado</h3>
                  <p className="text-gray-600 max-w-md">
                    {searchQuery
                      ? "Tente ajustar sua busca para encontrar o que procura."
                      : "A base de conhecimento está vazia. Artigos serão adicionados em breve."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
