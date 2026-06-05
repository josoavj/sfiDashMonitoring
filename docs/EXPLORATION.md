# 🔍 Guide de la Page Exploration

## Vue d'ensemble

La page Exploration permet une recherche personnalisée et avancée dans les données Elasticsearch du dashboard. Elle est conçue pour permettre aux administrateurs et analystes d'effectuer des recherches spécifiques par IP, port, protocole et intervalle de temps.

## Accès à la page

- **URL**: `/exploration`
- **Navigation**: Cliquez sur "Exploration" dans la barre de navigation supérieure
- **Entre**: Tableau de bord et Rapports

## Fonctionnalités principales

### 1. **Recherche par IP Source**

- Entrez une adresse IP source (ex: `192.168.1.100`)
- Filtre les résultats aux paquets provenant de cette IP
- Format: IPv4 standard

### 2. **Recherche par IP Destination**

- Entrez une adresse IP destination (ex: `10.0.0.50`)
- Filtre les résultats aux paquets allant à cette IP
- Format: IPv4 standard

### 3. **Recherche par Port Source**

- Numéro du port source (ex: `443`, `8080`)
- Optionnel - laissez vide pour tous les ports

### 4. **Recherche par Port Destination**

- **Port 14 configuré par défaut** pour recherches spécifiques
- Modifiez si besoin (ex: `80`, `443`, `3306`)
- Recherche courante pour le port 14

### 5. **Filtrage par Protocole**

- **Options disponibles**:
  - TCP (Transmission Control Protocol)
  - UDP (User Datagram Protocol)
  - ICMP (Internet Control Message Protocol)
  - IPv4 (Internet Protocol version 4)
  - IPv6 (Internet Protocol version 6)
- Sélectionnez "-- Tous --" pour ne pas filtrer

### 6. **Plage de temps**

- **Date de début**: Sélectionnez la date de début (par défaut: -24 heures)
- **Date de fin**: Sélectionnez la date de fin (par défaut: aujourd'hui)
- Les heures sont automatiquement fixées à 00:00:00 et 23:59:59

## Tableau des résultats

### Colonnes affichées

| Colonne | Description |
|---------|-------------|
| **Timestamp** | Date et heure du paquet |
| **IP Source** | Adresse IP source (en chip) |
| **IP Destination** | Adresse IP destination (en chip) |
| **Ports** | Format: `port_source → port_destination` |
| **Données (bytes)** | Volume en bytes (en chip, rouge si > 1MB) |
| **Service** | Application/service utilisé (chip bleu) |
| **Protocole** | TCP (bleu) ou UDP (orange) |

### Formatage des données

- **Bytes**: Conversion automatique en B, KB, MB, GB
- **Timestamps**: Formatage selon la locale FR
- **IPs**: Affichage en chips monospace pour visibilité

## Statistiques affichées

Au-dessus du tableau, 4 cartes affichent:

1. **Total de paquets**: Nombre de résultats trouvés
2. **Total de données**: Somme de tous les bytes
3. **Moy. par paquet**: Moyenne bytes/paquet
4. **Services uniques**: Nombre de services différents

## Actions disponibles

### Boutons de contrôle

- **Rechercher**: Lance la recherche avec les filtres actuels
  - Affiche "Recherche..." pendant l'exécution
  - Désactivé si une recherche est en cours
  
- **Réinitialiser**: Efface tous les filtres
  - Remet les valeurs par défaut
  - Port 14 réappliqué
  - Efface les résultats actuels

### Pagination

- **Précédent**: Affiche les résultats précédents (50 par défaut)
- **Suivant**: Affiche les résultats suivants
- Informations: "Affichage X-Y de Z résultats"

## Cas d'usage courants

### 1. Analyser le trafic sur le port 14

```
Port Destination: 14
Date: Hier à aujourd'hui
→ Voir tous les services sur le port 14
```

### 2. Analyser une IP spécifique

```
IP Source: 192.168.1.100
Date: Dernières 24 heures
→ Voir tout le trafic sortant d'une machine
```

### 3. Analyser une connexion spécifique

```
IP Source: 192.168.1.100
IP Destination: 10.0.0.50
Port Destination: 443
→ Voir les connexions HTTPS entre deux machines
```

### 4. Analyser le trafic UDP

```
Protocole: UDP
Date: Dernières 48 heures
→ Voir tout le trafic UDP (DNS, DHCP, etc.)
```

### 5. Plage horaire spécifique

```
Date de début: 2024-11-15
Date de fin: 2024-11-16
IP Source: 10.0.0.0/24 (simulé)
→ Analyser le trafic sur une période précise
```

## Endpoints API utilisés

### 1. **POST /api/exploration/search**

Recherche principale avec tous les filtres

**Paramètres**:
```javascript
{
  sourceIp: "192.168.1.100",           // Optionnel
  destinationIp: "10.0.0.50",          // Optionnel
  sourcePort: 443,                      // Optionnel
  destinationPort: 14,                  // Optionnel
  protocol: "tcp",                      // Optionnel
  timeRange: {
    from: timestamp,
    to: timestamp
  },
  from: 0,                              // Pagination
  size: 50,                             // Taille page
  sortField: "@timestamp",
  sortOrder: "desc"
}
```

**Réponse**:
```javascript
{
  total: 1000,                          // Nombre total de résultats
  hits: [...],                          // Données avec métadonnées
  took: 145                             // Temps (ms)
}
```

### 2. **POST /api/exploration/ip-range** (Futur)

Recherche par plage d'IP

**Paramètres**:
```javascript
{
  startIp: "192.168.1.0",
  endIp: "192.168.1.255",
  field: "source.ip",
  timeRange: {...}
}
```

### 3. **POST /api/exploration/services-by-port** (Futur)

Services sur un port spécifique

**Paramètres**:
```javascript
{
  port: 14,
  field: "destination.port",
  timeRange: {...}
}
```

**Réponse**:
```javascript
{
  services: [...],                      // Services trouvés
  topSources: [...],                    // IPs sources principales
  stats: {
    totalBytes: 10000000,
    avgBytes: 1000,
    portQueried: 14
  }
}
```

## Thème et interface

- **Thème unifié**: Suit le thème global de l'application (clair/sombre)
- **Material-UI**: Composants cohérents avec le reste du dashboard
- **Responsive**: Adaptée aux écrans mobiles et desktop
- **Chips**: Utilisation de chips pour un affichage compact
- **Gradients**: Boutons avec gradients pour meilleure UX

## Messages d'erreur courants

| Message | Cause | Solution |
|---------|-------|----------|
| "Erreur lors de la recherche" | Problème de connexion au backend | Vérifiez la connexion Elasticsearch |
| "Aucun résultat" | Filtres trop restrictifs | Élargissez la plage de dates ou les filtres |
| Pas de résultats | Données inexistantes pour la période | Consultez les statistiques du dashboard |

## Conseils d'optimisation

1. **Plages de temps courtes**: < 24 heures pour meilleures performances
2. **Filtres combinés**: Combinez plusieurs filtres pour réduire les résultats
3. **Pagination**: Consultez les résultats par pages de 50
4. **Ports spécifiques**: Ciblage du port 14 pour analyses rapides

## Limitations

- Maximum 10,000 résultats (Elasticsearch limit)
- Affichage 50 résultats par page
- Historique limité à disponibilité Elasticsearch
- Plage de temps limitée à capacité de stockage

## Notes de sécurité

- Accès non authentifié possible (en fonction de configuration)
- Données sensibles affichées (IPs, ports, services)
- Pensez à auditer les recherches effectuées
- Protégez les données sensibles selon politique d'entreprise

