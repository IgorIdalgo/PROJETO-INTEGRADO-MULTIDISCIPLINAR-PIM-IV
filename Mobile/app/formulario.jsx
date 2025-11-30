import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AZURE_API_URL } from '../config';

const getProperty = (obj, keys) => {
    if (!obj) return null;
    for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null) return obj[key];
    }
    return null;
};

export default function FormularioScreen() {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [urgencia, setUrgencia] = useState('Média'); 
  const [categoria, setCategoria] = useState(1); 
  const [loading, setLoading] = useState(false);
  
  const router = useRouter(); 

  const categoriasDisponiveis = [
    { label: 'Hardware', value: 1 },
    { label: 'Software', value: 2 },
    { label: 'Rede', value: 3 },
    { label: 'Acessos', value: 4 },
  ];
  
  const handleAbrirChamado = async () => {
    if (!titulo || !descricao) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('jwt_token');
      if (!token) {
        Alert.alert('Sessão Expirada', 'Por favor, faça login novamente.');
        setLoading(false);
        return; 
      }

      const chamadoDto = {
        titulo: titulo,
        descricao: descricao,
        id_categoria: categoria,
        urgencia: urgencia, 
      };

      const response = await fetch(`${AZURE_API_URL}/api/chamados`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(chamadoDto),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }

      const chamadoCriado = await response.json();
      setLoading(false);
      
      const idChamado = getProperty(chamadoCriado, ['idChamado', 'IdChamado', 'id_chamado', 'id']);
      const data = getProperty(chamadoCriado, ['dataAbertura', 'DataAbertura', 'dataabertura']);
      const status = getProperty(chamadoCriado, ['status', 'Status']);
      const prioridadeIA = getProperty(chamadoCriado, ['prioridade', 'Prioridade', 'prioridadeDoChamado']);
      const sugestaoIA = getProperty(chamadoCriado, [
          'resolucaoIA_Sugerida', 'ResolucaoIA_Sugerida', 'sugestaoIA', 'sugestao'
      ]);
      const urgenciaUsuario = getProperty(chamadoCriado, ['urgencia', 'Urgencia']) || urgencia;

      router.replace({
        pathname: '/sucesso',
        params: {
          id: idChamado || '????', 
          data: data,
          status: status,
          urgenciaUsuario: urgenciaUsuario, 
          prioridadeIA: prioridadeIA || "Não definida", 
          sugestao: sugestaoIA || "A IA analisou, mas não retornou texto de sugestão.", 
        },
      });

    } catch (error) {
      Alert.alert('Erro ao Criar Chamado', error.message);
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#548a8a' }}>
      
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.replace('/home')} 
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo Chamado</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formContainer}>
          
          <Text style={styles.sectionTitle}>Detalhes do Problema</Text>

          <Text style={styles.label}>Título</Text>
          <TextInput
            style={styles.input}
            placeholder="Resumo do problema"
            value={titulo}
            onChangeText={setTitulo}
          />

          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descreva detalhadamente o que aconteceu..."
            value={descricao}
            onChangeText={setDescricao}
            multiline
            numberOfLines={5}
            textAlignVertical="top" 
          />

          <Text style={styles.label}>Nível de Urgência</Text>
          <View style={styles.urgenciaContainer}>
            {['Baixa', 'Média', 'Alta'].map(level => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.urgenciaChip,
                  urgencia === level && styles.urgenciaChipSelected,
                ]}
                onPress={() => setUrgencia(level)}> 
                <Text
                  style={[
                    styles.urgenciaText,
                    urgencia === level && styles.urgenciaTextSelected,
                  ]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Categoria</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={categoria}
              onValueChange={(itemValue) => setCategoria(itemValue)}
              style={styles.picker}
              itemStyle={styles.pickerItem} 
            >
              {categoriasDisponiveis.map(item => (
                  <Picker.Item key={item.value} label={item.label} value={item.value} />
              ))}
            </Picker>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleAbrirChamado}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#548a8a" />
            ) : (
              <Text style={styles.buttonText}>
                Enviar Chamado
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 50, 
    paddingBottom: 15,
    backgroundColor: '#548a8a', 
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  backButton: {
    padding: 5,
  },
  scrollContent: {
    flexGrow: 1, 
    alignItems: 'center',
    paddingBottom: 50,
  },
  formContainer: {
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: 400,
  },
  sectionTitle: { 
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    marginTop: 10,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white', 
    marginBottom: 8,
    marginTop: 10,
  },
  textArea: {
    height: 120, 
    paddingTop: 10,
  },
  urgenciaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  urgenciaChip: {
    flex: 1,
    padding: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 5,
    alignItems: 'center',
  },
  urgenciaChipSelected: {
    backgroundColor: 'white',
  },
  urgenciaText: {
    color: 'white',
    fontWeight: 'bold',
  },
  urgenciaTextSelected: {
    color: '#548a8a',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    height: 50,
    justifyContent: 'center',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#333',
  },
  pickerItem: {
  },
  button: {
    width: '100%',
    height: 55,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    flexDirection: 'row',
    backgroundColor: 'white',
    elevation: 3, 
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#548a8a',
  },
});