import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { AZURE_API_URL } from '../config';

export default function HomeScreen() {
  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estado para controlar o filtro ativo
  const [filtroAtivo, setFiltroAtivo] = useState('Todos'); 

  const router = useRouter();

  // Opções de filtro disponíveis
  const filtros = ['Todos', 'Aberto', 'Em Andamento', 'Resolvido'];

  const fetchChamados = async () => {
    try {
      const token = await AsyncStorage.getItem('jwt_token');
      if (!token) {
        router.replace('/'); 
        return;
      }

      const response = await fetch(`${AZURE_API_URL}/api/chamados/meus`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        Alert.alert('Sessão Expirada', 'Faça login novamente.');
        await AsyncStorage.removeItem('jwt_token');
        router.replace('/');
        return;
      }

      if (!response.ok) throw new Error('Erro ao buscar chamados.');

      const data = await response.json();
      
      // Ordena: Mais recentes primeiro
      const ordenados = data.sort((a, b) => new Date(b.dataAbertura) - new Date(a.dataAbertura));
      
      setChamados(ordenados);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar seus chamados.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchChamados();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchChamados();
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('jwt_token');
    router.replace('/');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Aberto': return '#3498db'; 
      case 'Em Andamento': return '#f39c12'; 
      case 'Resolvido': return '#2ecc71'; 
      case 'Fechado': return '#95a5a6'; 
      case 'Cancelado': return '#e74c3c'; 
      default: return '#95a5a6';
    }
  };

  // --- LÓGICA DE FILTRAGEM ---
  const chamadosFiltrados = chamados.filter(chamado => {
    if (filtroAtivo === 'Todos') return true;
    if (filtroAtivo === 'Resolvido') {
        return ['Resolvido', 'Fechado', 'Cancelado'].includes(chamado.status);
    }
    return chamado.status === filtroAtivo;
  });

  // --- COMPONENTE DO ITEM (CARD) ATUALIZADO PARA CLIQUE ---
  const renderItem = ({ item }) => {
    const dataFormatada = new Date(item.dataAbertura).toLocaleDateString('pt-BR');
    
    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => {
            // Navega para a NOVA tela de Detalhes
            router.push({
                pathname: '/detalhes', 
                params: {
                    id: item.idChamado,
                    titulo: item.titulo,       // Envia o Título
                    descricao: item.descricao, // Envia a Descrição Completa
                    data: item.dataAbertura, 
                    status: item.status,
                    urgenciaUsuario: item.urgencia,
                    prioridadeIA: item.prioridade,
                    sugestao: item.resolucaoIA_Sugerida,
                    // IMPORTANTE: Serializa os anexos para passar via parâmetro
                    anexos: JSON.stringify(item.anexos || []) 
                }
            });
        }}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardId}>#{item.idChamado}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        
        <Text style={styles.cardTitle} numberOfLines={1}>{item.titulo}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.descricao}</Text>
        
        <View style={styles.cardFooter}>
          <Text style={styles.cardDate}>📅 {dataFormatada}</Text>
          <Text style={styles.cardPriority}>Prioridade: {item.prioridade}</Text>
        </View>
      </TouchableOpacity>
    );
  };
  // -------------------------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meus Chamados</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <MaterialIcons name="logout" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* --- BARRA DE FILTROS --- */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={filtros}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                filtroAtivo === item && styles.filterChipSelected
              ]}
              onPress={() => setFiltroAtivo(item)}
            >
              <Text style={[
                styles.filterText,
                filtroAtivo === item && styles.filterTextSelected
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 15 }}
        />
      </View>

      {/* LISTA DE CHAMADOS */}
      {loading ? (
        <ActivityIndicator size="large" color="#FFF" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={chamadosFiltrados} 
          renderItem={renderItem}
          keyExtractor={(item) => item.idChamado.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="filter-list-off" size={60} color="rgba(255,255,255,0.5)" />
              <Text style={styles.emptyText}>Nenhum chamado com status {filtroAtivo}.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push('/formulario')} 
        activeOpacity={0.8}
      >
        <MaterialIcons name="add" size={30} color="#548a8a" />
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#548a8a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 15,
    backgroundColor: '#467575', 
    elevation: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  logoutButton: {
    padding: 5,
  },
  // Filtros
  filterContainer: {
    paddingVertical: 10,
    backgroundColor: '#4e8080', 
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  filterChipSelected: {
    backgroundColor: 'white',
    borderColor: 'white',
  },
  filterText: {
    color: 'white',
    fontWeight: '600',
  },
  filterTextSelected: {
    color: '#548a8a',
    fontWeight: 'bold',
  },
  // Lista
  listContent: {
    padding: 15,
    paddingBottom: 80, 
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 3, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardId: {
    fontSize: 14,
    color: '#888',
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  cardDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  cardDate: {
    fontSize: 12,
    color: '#999',
  },
  cardPriority: {
    fontSize: 12,
    color: '#548a8a',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
    opacity: 0.8,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});