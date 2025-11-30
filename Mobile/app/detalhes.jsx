import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function DetalhesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // 1. Desestruturar e tratar os dados recebidos
  const { 
    id, 
    titulo, 
    descricao, 
    data, 
    status, 
    urgenciaUsuario, 
    prioridadeIA, 
    sugestao,
    anexos // Recebe como string JSON
  } = params;

  // Parse dos Anexos (se houver)
  let listaAnexos = [];
  try {
    if (anexos) listaAnexos = JSON.parse(anexos);
  } catch (e) {
    console.log("Erro ao ler anexos", e);
  }

  // Formatação de Data
  const dataFormatada = data ? new Date(data).toLocaleString('pt-BR') : '-';

  // Função de Cores
  const getStatusColor = (st) => {
    switch (st) {
      case 'Aberto': return '#3498db'; 
      case 'Em Andamento': return '#f39c12'; 
      case 'Resolvido': return '#2ecc71'; 
      case 'Fechado': return '#95a5a6'; 
      case 'Cancelado': return '#e74c3c'; 
      default: return '#95a5a6';
    }
  };

  const handleImagePress = (url) => {
    setSelectedImage(url);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do Chamado</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* CABEÇALHO DO CHAMADO */}
        <View style={styles.topCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.idText}>#{id}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
              <Text style={styles.statusText}>{status}</Text>
            </View>
          </View>
          <Text style={styles.dateText}>📅 Aberto em: {dataFormatada}</Text>
        </View>

        {/* DESCRIÇÃO DO PROBLEMA */}
        <View style={styles.section}>
          <Text style={styles.label}>Título:</Text>
          <Text style={styles.valueTitle}>{titulo}</Text>
          
          <Text style={[styles.label, { marginTop: 15 }]}>Descrição:</Text>
          <View style={styles.descBox}>
            <Text style={styles.valueDesc}>{descricao}</Text>
          </View>
        </View>

        {/* ANÁLISE DA IA */}
        <View style={styles.aiContainer}>
          <View style={styles.rowAiHeader}>
            <MaterialIcons name="auto-awesome" size={24} color="#f1c40f" />
            <Text style={styles.aiTitle}> Análise Inteligente</Text>
          </View>
          
          <View style={styles.rowBetween}>
            <Text style={styles.aiLabel}>Sua Urgência:</Text>
            <Text style={styles.aiValue}>{urgenciaUsuario}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.aiLabel}>Prioridade IA:</Text>
            <Text style={[styles.aiValue, { fontWeight: 'bold', color: '#e67e22' }]}>
                {prioridadeIA}
            </Text>
          </View>

          <View style={styles.divider} />
          
          <Text style={styles.aiLabel}>Sugestão Técnica:</Text>
          <Text style={styles.aiSugestao}>{sugestao || "Nenhuma análise disponível."}</Text>
        </View>

        {/* ANEXOS (GALERIA) */}
        {listaAnexos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Anexos ({listaAnexos.length}):</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
              {listaAnexos.map((anexo, index) => (
                <TouchableOpacity key={index} onPress={() => handleImagePress(anexo.url)}>
                  <Image 
                    source={{ uri: anexo.url }} 
                    style={styles.thumbImage} 
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

      </ScrollView>

      {/* MODAL DE ZOOM DA IMAGEM */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
            <MaterialIcons name="close" size={30} color="white" />
          </TouchableOpacity>
          {selectedImage && (
            <Image 
              source={{ uri: selectedImage }} 
              style={styles.fullImage} 
              resizeMode="contain" 
            />
          )}
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 50, paddingBottom: 15, paddingHorizontal: 15,
    backgroundColor: '#548a8a', elevation: 4
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  scrollContent: { padding: 15, paddingBottom: 40 },
  
  topCard: {
    backgroundColor: 'white', borderRadius: 10, padding: 15, marginBottom: 15,
    elevation: 2
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  idText: { fontSize: 18, fontWeight: 'bold', color: '#555' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15 },
  statusText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  dateText: { color: '#999', fontSize: 12, marginTop: 5 },

  section: { marginBottom: 20 },
  label: { fontSize: 14, color: '#888', fontWeight: 'bold', marginBottom: 5 },
  valueTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  descBox: { backgroundColor: 'white', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
  valueDesc: { fontSize: 15, color: '#444', lineHeight: 22 },

  // Estilos da IA
  aiContainer: {
    backgroundColor: '#34495e', borderRadius: 10, padding: 15, marginBottom: 20,
    elevation: 3
  },
  rowAiHeader: { flexDirection: 'row', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: 10 },
  aiTitle: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  aiLabel: { color: '#bdc3c7', fontSize: 14 },
  aiValue: { color: 'white', fontSize: 15 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 10 },
  aiSugestao: { color: '#ecf0f1', fontStyle: 'italic', lineHeight: 20, marginTop: 5 },

  // Estilos Anexos
  gallery: { flexDirection: 'row', marginTop: 5 },
  thumbImage: { width: 100, height: 100, borderRadius: 10, marginRight: 10, backgroundColor: '#ddd' },
  
  // Modal
  modalContainer: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  closeButton: { position: 'absolute', top: 40, right: 20, zIndex: 10, padding: 10 },
  fullImage: { width: '100%', height: '80%' }
});