import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useFavoritesStore } from '../../lib/stores/favoritesStore';
import { LinearGradient } from 'expo-linear-gradient';

type Resort = {
  id: number;
  created_at: string;
  "Ski Resort": string;
  "Snowfall 6 days ago": number;
  "Snowfall 5 days ago": number;
  "Snowfall 4 days ago": number;
  "Snowfall 3 days ago": number;
  "Snowfall 2 days ago": number;
  "Snowfall 1 day ago": number;
  "Snowfall forecasted today": number;
  "Snowfall forecasted in 1 day": number;
  "Snowfall forecasted in 2 days": number;
  "Snowfall forecasted in 3 days": number;
  "Snowfall forecasted in 4 days": number;
  "Snowfall forecasted in 5 days": number;
  "Mid Mountain Snow": number;
  "Lifts Open": string;
  "Runs Open": string;
};

interface AddFavoritesModalProps {
  visible: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Resort[] | undefined;
  onAddFavorite: (id: number) => void;
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1418985991508-e47386d96a71?q=80';

function ResortCard({ resort, onRemove }: { resort: Resort; onRemove: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const calculateRecentSnow = (resort: Resort) => {
    return (
      (resort["Snowfall 1 day ago"] || 0) +
      (resort["Snowfall 2 days ago"] || 0)
    );
  };

  const calculateForecastedSnow = (resort: Resort) => {
    return (
      (resort["Snowfall forecasted today"] || 0) +
      (resort["Snowfall forecasted in 1 day"] || 0) +
      (resort["Snowfall forecasted in 2 days"] || 0)
    );
  };

  const renderDetailedView = () => {
    const pastSnow = [
      { day: formatDate(6), amount: resort["Snowfall 6 days ago"] || 0 },
      { day: formatDate(5), amount: resort["Snowfall 5 days ago"] || 0 },
      { day: formatDate(4), amount: resort["Snowfall 4 days ago"] || 0 },
      { day: formatDate(3), amount: resort["Snowfall 3 days ago"] || 0 },
      { day: formatDate(2), amount: resort["Snowfall 2 days ago"] || 0 },
      { day: formatDate(1), amount: resort["Snowfall 1 day ago"] || 0 },
    ];

    const forecast = [
      { day: formatDate(-0), amount: resort["Snowfall forecasted today"] || 0 },
      { day: formatDate(-1), amount: resort["Snowfall forecasted in 1 day"] || 0 },
      { day: formatDate(-2), amount: resort["Snowfall forecasted in 2 days"] || 0 },
      { day: formatDate(-3), amount: resort["Snowfall forecasted in 3 days"] || 0 },
      { day: formatDate(-4), amount: resort["Snowfall forecasted in 4 days"] || 0 },
      { day: formatDate(-5), amount: resort["Snowfall forecasted in 5 days"] || 0 },
    ];

    return (
      <View style={styles.detailedView}>
        <View style={styles.detailedSection}>
          <Text style={styles.sectionTitle}>Past Snowfall</Text>
          <View style={styles.detailedGrid}>
            {pastSnow.map((day, index) => (
              <View key={index} style={styles.dayStats}>
                <Text style={styles.dayAmount}>{day.amount}"</Text>
                <Text style={styles.dayLabel}>{day.day}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.detailedSection}>
          <Text style={styles.sectionTitle}>Forecast</Text>
          <View style={styles.detailedGrid}>
            {forecast.map((day, index) => (
              <View key={index} style={styles.dayStats}>
                <Text style={styles.dayAmount}>{day.amount}"</Text>
                <Text style={styles.dayLabel}>{day.day}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.operationsContainer}>
          <View style={styles.operationStat}>
            <Text style={styles.operationLabel}>Lifts Open</Text>
            <Text style={styles.operationValue}>{resort["Lifts Open"]}</Text>
          </View>
          <View style={styles.operationStat}>
            <Text style={styles.operationLabel}>Runs Open</Text>
            <Text style={styles.operationValue}>{resort["Runs Open"]}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <TouchableOpacity 
      style={[styles.card, isExpanded && styles.expandedCard]}
      onPress={() => setIsExpanded(!isExpanded)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: DEFAULT_IMAGE }} style={styles.cardImage} />
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
        style={styles.gradient}
      />
      
      <View style={styles.contentWrapper}>
        <View style={styles.resortNameContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.resortName}>{resort["Ski Resort"]}</Text>
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <Ionicons name="close-circle" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Ionicons name="snow" size={20} color="#fff" />
            <Text style={styles.statText}>{calculateRecentSnow(resort)}"</Text>
            <Text style={styles.statLabel}>Last 2 Days</Text>
          </View>
          
          <View style={styles.stat}>
            <Ionicons name="calendar" size={20} color="#fff" />
            <Text style={styles.statText}>{calculateForecastedSnow(resort)}"</Text>
            <Text style={styles.statLabel}>Next 3 Days</Text>
          </View>
          
          <View style={styles.stat}>
            <Ionicons name="resize" size={20} color="#fff" />
            <Text style={styles.statText}>{resort["Mid Mountain Snow"] || 0}"</Text>
            <Text style={styles.statLabel}>Base Depth</Text>
          </View>
        </View>

        {isExpanded && renderDetailedView()}
      </View>
    </TouchableOpacity>
  );
}

function AddFavoritesModal({
  visible,
  onClose,
  searchQuery,
  setSearchQuery,
  searchResults,
  onAddFavorite,
}: AddFavoritesModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Favorites</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Search resorts..."
            placeholderTextColor="#71717a"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <FlatList
            data={searchResults}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.searchResult}
                onPress={() => {
                  onAddFavorite(item.id);
                  onClose();
                  setSearchQuery('');
                }}
              >
                <Text style={styles.searchResultText}>{item["Ski Resort"]}</Text>
                <Ionicons name="add-circle-outline" size={24} color="#fff" />
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id.toString()}
          />
        </View>
      </View>
    </Modal>
  );
}

export default function FavoritesScreen() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { favorites, addFavorite, removeFavorite } = useFavoritesStore();

  const { data: resorts } = useQuery({
    queryKey: ['resorts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('onthesnow')
        .select('*')
        .order('"Ski Resort"');

      if (error) throw error;
      return data;
    },
  });

  const favoriteResorts = resorts?.filter(resort => 
    favorites.includes(resort.id)
  );

  const searchResults = resorts?.filter(resort =>
    resort["Ski Resort"].toLowerCase().includes(searchQuery.toLowerCase()) &&
    !favorites.includes(resort.id)
  );

  if (!favorites.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No favorites yet</Text>
        <Text style={styles.subtext}>
          Add resorts to your favorites to track them here
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsModalVisible(true)}
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Favorites</Text>
        </TouchableOpacity>

        <AddFavoritesModal
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          onAddFavorite={addFavorite}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsModalVisible(true)}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      <FlatList
        data={favoriteResorts}
        renderItem={({ item }) => (
          <ResortCard
            resort={item}
            onRemove={() => removeFavorite(item.id)}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
      />

      <AddFavoritesModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        onAddFavorite={addFavorite}
      />
    </View>
  );
}

const formatDate = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
  const month = date.getMonth() + 1;
  const dayNum = date.getDate();
  return `${dayOfWeek} ${month}/${dayNum}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1b1e',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 24,
  },
  subtext: {
    fontSize: 16,
    color: '#71717a',
    textAlign: 'center',
    marginTop: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    marginTop: 24,
    alignSelf: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#3b82f6',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    elevation: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1b1e',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchInput: {
    backgroundColor: '#2c2d31',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  searchResult: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2d31',
  },
  searchResultText: {
    color: '#fff',
    fontSize: 16,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#2c2d31',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 4,
  },
  cardImage: {
    width: '100%',
    height: 200,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
  },
  contentWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 16,
  },
  resortNameContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resortName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 12,
    marginTop: 'auto',
    marginBottom: 16,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statLabel: {
    color: '#d4d4d8',
    fontSize: 12,
  },
  expandedCard: {
    minHeight: 480,
  },
  detailedView: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    marginTop: 10,
  },
  detailedSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detailedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayStats: {
    width: '16%',
    alignItems: 'center',
    marginBottom: 6,
    padding: 4,
    minHeight: 60,
  },
  dayAmount: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  dayLabel: {
    color: '#d4d4d8',
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 12,
    marginBottom: 2,
  },
  operationsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 16,
  },
  operationStat: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  operationLabel: {
    color: '#d4d4d8',
    fontSize: 12,
    marginBottom: 2,
  },
  operationValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
});