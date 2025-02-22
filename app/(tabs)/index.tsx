import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

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

type DetailedStats = {
  pastSnow: { day: string; amount: number }[];
  forecast: { day: string; amount: number }[];
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1418985991508-e47386d96a71?q=80';

const formatDate = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
  const month = date.getMonth() + 1;
  const dayNum = date.getDate();
  return `${dayOfWeek} ${month}/${dayNum}`;
};

const normalizeResortName = (name: string): string => {
  return name.trim().replace(/\s+/g, ' ');
};

export default function ResortsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedResortId, setExpandedResortId] = useState<number | null>(null);

  const { data: resorts, isLoading, error, refetch } = useQuery({
    queryKey: ['resorts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('onthesnow')
        .select('*')
        .order('"Ski Resort"');

      if (error) throw error;
      
      // Log all resort names to help create coordinates mapping
      console.log('All resort names:', data.map(resort => resort["Ski Resort"]).sort());
      
      return data as Resort[];
    },
  });

  const filteredResorts = resorts?.filter(resort =>
    resort["Ski Resort"].toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const getDetailedStats = useCallback((resort: Resort): DetailedStats => {
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

    return { pastSnow, forecast };
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    setExpandedResortId(null);
  };

  useEffect(() => {
    if (filteredResorts?.length === 1) {
      setExpandedResortId(filteredResorts[0].id);
    }
  }, [filteredResorts?.length]);

  const handleCardPress = (resortId: number) => {
    setExpandedResortId(current => current === resortId ? null : resortId);
  };

  const renderDetailedView = (resort: Resort) => {
    const { pastSnow, forecast } = getDetailedStats(resort);
    
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

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading resorts</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderResortCard = ({ item }: { item: Resort }) => {
    const isExpanded = expandedResortId === item.id;
    
    return (
      <TouchableOpacity 
        style={[styles.card, isExpanded && styles.expandedCard]}
        onPress={() => handleCardPress(item.id)}
        activeOpacity={0.8}
      >
        <Image source={{ uri: DEFAULT_IMAGE }} style={styles.cardImage} />
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        />
        
        <View style={styles.contentWrapper}>
          <View style={styles.resortNameContainer}>
            <Text style={styles.resortName}>{item["Ski Resort"]}</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Ionicons name="snow" size={20} color="#fff" />
              <Text style={styles.statText}>{calculateRecentSnow(item)}"</Text>
              <Text style={styles.statLabel}>Last 2 Days</Text>
            </View>
            
            <View style={styles.stat}>
              <Ionicons name="calendar" size={20} color="#fff" />
              <Text style={styles.statText}>{calculateForecastedSnow(item)}"</Text>
              <Text style={styles.statLabel}>Next 3 Days</Text>
            </View>
            
            <View style={styles.stat}>
              <Ionicons name="resize" size={20} color="#fff" />
              <Text style={styles.statText}>{item["Mid Mountain Snow"] || 0}"</Text>
              <Text style={styles.statLabel}>Base Depth</Text>
            </View>
          </View>

          {isExpanded && renderDetailedView(item)}

          <Text style={styles.updateTime}>
            Updated: {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#71717a" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search resorts..."
          placeholderTextColor="#71717a"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : (
        <FlatList
          data={filteredResorts}
          renderItem={renderResortCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No resorts found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1b1e',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c2d31',
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
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
  resortName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
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
  updateTime: {
    color: '#71717a',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'right',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 18,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#71717a',
    fontSize: 18,
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