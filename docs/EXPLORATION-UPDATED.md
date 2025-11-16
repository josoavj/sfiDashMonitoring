# 🔍 Guide de la Page Exploration - Édition Mise à Jour

## Vue d'ensemble

La page Exploration permet une recherche personnalisée et avancée dans les données Elasticsearch du dashboard. Elle est conçue pour permettre aux administrateurs et analystes d'effectuer des recherches spécifiques par IP, port, protocole et intervalle de temps.

**Nouveautés**: Support de recherche par plage d'IPs (ex: 192.168.1.1 - 192.168.255.255)

## Accès à la page

- **URL**: `/exploration`
- **Navigation**: Cliquez sur "Exploration" dans la barre de navigation supérieure
- **Position**: Entre "Tableau de bord" et "Rapports"

## Modes de recherche

### 🔸 Mode 1: Recherche Avancée

Le mode par défaut avec filtres individuels pour chaque paramètre.

#### Filtres disponibles:

**1. IP Source**
- Entrez une adresse IP source (ex: `192.168.1.100`)
- Filtre les résultats aux paquets provenant de cette IP
- Format: IPv4 standard (XXX.XXX.XXX.XXX)

**2. IP Destination**
- Entrez une adresse IP destination (ex: `10.0.0.50`)
- Filtre les résultats aux paquets allant à cette IP
- Format: IPv4 standard

**3. Port Source**
- Numéro du port source (ex: `443`, `8080`)
- Optionnel - laissez vide pour tous les ports

**4. Port Destination**
- **Port 14 configuré par défaut** pour analyses spécifiques
- Modifiez si besoin (ex: `80`, `443`, `3306`)

**5. Protocole**
- Options: TCP, UDP, ICMP, IPv4, IPv6
- Sélectionnez un protocole ou laissez vide

**6. Plage de temps**
- **Date de début**: Par défaut -24 heures
- **Date de fin**: Par défaut aujourd'hui
- Les heures sont automatiquement fixées à 00:00:00 et 23:59:59

#### Actions:
- **Rechercher**: Lance la recherche avec les filtres
- **Réinitialiser**: Vide tous les champs et restaure les valeurs par défaut

---

### 🔸 Mode 2: Recherche par Plage d'IPs ⭐ NEW

Permet de chercher tous les paquets dans une plage d'adresses IP.

#### Paramètres:

**IP de début**
- Première IP de la plage (ex: `192.168.0.1`)
- Format: IPv4 standard

**IP de fin**
- Dernière IP de la plage (ex: `192.168.255.255`)
- Doit être ≥ IP de début

**Date de début/fin**
- Même fonctionnement que le mode avancé

#### Exemples de plages courantes:

| Cas d'usage | IP début | IP fin |
|-----------|----------|--------|
| Réseau local complet | 192.168.0.0 | 192.168.255.255 |
| Subnet /24 | 192.168.1.0 | 192.168.1.255 |
| DMZ classe B | 172.16.0.0 | 172.31.255.255 |
| Subnet 10.0 | 10.0.0.0 | 10.0.255.255 |
| Plage spécifique | 192.168.10.1 | 192.168.10.254 |

#### Actions:
- **Rechercher par plage**: Lance la recherche (désactivé si IPs manquantes)
- **Réinitialiser**: Remet tout à zéro et bascule au mode Avancé

---

## Statistiques affichées

Après une recherche, 4 cartes statistiques s'affichent:

1. **Total de paquets**: Nombre de résultats trouvés
2. **Total de données**: Somme totale en bytes (formatée: B, KB, MB, GB)
3. **Moy. par paquet**: Moyenne de bytes par paquet
4. **Services uniques**: Nombre d'applications différentes détectées

---

## Tableau des résultats

### Colonnes:
| Colonne | Description |
|---------|-------------|
| Timestamp | Date/heure du paquet (format locale FR) |
| IP Source | Adresse source (chip monospace) |
| IP Destination | Adresse destination (chip monospace) |
| Ports | Port source → Port destination |
| Données (bytes) | Volume en bytes (chip rouge si > 1MB) |
| Service | Nom de l'application (chip bleu) |
| Protocole | Type (TCP=bleu, UDP=orange) |

### Pagination:
- **Par défaut**: 50 résultats par page
- **Navigation**: Boutons "Précédent" et "Suivant"
- **Affichage**: "Résultats X-Y de Z"

---

## Cas d'usage courants

### ✅ Analyser le trafic sur le port 14
1. Mode: Recherche Avancée
2. Laisser tous les champs sauf Port Destination (défaut: 14)
3. Définir la plage de temps
4. Cliquer "Rechercher"
5. Analyser les services et IPs utilisés

### ✅ Vérifier trafic d'un subnet complet
1. Mode: Plage d'IPs
2. IP début: `192.168.1.0`
3. IP fin: `192.168.1.255`
4. Définir les dates
5. Cliquer "Rechercher par plage"

### ✅ Détecter comportement suspect d'une IP
1. Mode: Recherche Avancée
2. IP Source: `192.168.1.100`
3. Date: Dernières 24h
4. Analyser les ports et services contactés

### ✅ Monitoring du trafic externe
1. Mode: Recherche Avancée
2. IP Destination: `8.8.8.8` (ou autre externe)
3. Vérifier qui contacte et avec quel service

---

## Messages d'erreur et solutions

| Erreur | Solution |
|--------|----------|
| "Aucun résultat" | Vérifier les filtres, élargir la plage de temps |
| "Erreur lors de la recherche" | Backend indisponible, rafraîchir ou réessayer |
| Bouton "Rechercher" grisé | Remplir les IPs début/fin en mode Plage d'IPs |

---

## Performance et optimisations

- Les résultats sont paginés (50 par page) pour performance
- Les plages d'IPs larges (ex: /8) peuvent être lentes
- Pour les recherches lourdes, réduire la plage de temps
- Les stats sont calculées sur la page actuelle

---

## Architecture backend

### Endpoints utilisés:

**POST /api/exploration/search**
- Recherche avancée avec filtres individuels

**POST /api/exploration/ip-range**
- Recherche par plage d'IPs

**POST /api/exploration/services-by-port**
- Analyse des services par port (utilisé en arrière-plan)

Tous les endpoints supportent:
- Pagination (from, size)
- Plage de temps (timeRange)
- Formatage des résultats

---

## Paramètres avancés

### Champs Elasticsearch utilisés:
- `source.ip` - IP source
- `destination.ip` - IP destination
- `source.port` - Port source
- `destination.port` - Port destination
- `network.bytes` - Taille en bytes
- `network.application` - Service/Application
- `network.protocol` - Protocole
- `@timestamp` - Timestamp

### Tri:
- Par défaut: Descendant sur timestamp (plus récent d'abord)

---

## Conseils d'utilisation

✅ **À faire:**
- Combiner les filtres pour affiner les résultats
- Utiliser les plages de dates pour limiter les données
- Vérifier la plage IP plusieurs fois avant la recherche
- Exporter/sauvegarder les résultats utiles

❌ **À éviter:**
- Les plages d'IPs très larges sans limite de temps
- Trop de filtres simultanés (combinaison vide)
- Rafraîchir rapidement (risque de surcharge)
- Oublier de réinitialiser après chaque analyse
