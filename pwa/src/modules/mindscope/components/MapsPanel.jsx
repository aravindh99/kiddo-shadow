import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Add,
  AutoAwesome,
  Close,
  Explore,
  MyLocation,
  Public,
  Refresh,
  RestartAlt,
  Remove,
  Search,
  TaskAlt,
} from "@mui/icons-material";
import { askAiQuestion } from "../../ai-chat/api/aiChat.api";

const mapPhotos = [
  {
    id: "india",
    title: "India Outline Map",
    caption: "States, rivers, ports, minerals, mountains, and regional geography.",
    imageUrl: "/maps/india outline.jpg",
    practiceImageUrl: "/maps/india outline empty.jpg",
    practiceAspectRatio: "862 / 1000",
    accent: "#1565c0",
    questions: [
      { id: "india-1", label: "North India", answer: "north india", marks: 2, x: 46, y: 23 },
      { id: "india-2", label: "West India", answer: "west india", marks: 2, x: 27, y: 49 },
      { id: "india-3", label: "East India", answer: "east india", marks: 2, x: 61, y: 52 },
      { id: "india-4", label: "South India", answer: "south india", marks: 2, x: 43, y: 79 },
      { id: "india-5", label: "Island Territories", answer: "island territories", marks: 2, x: 67, y: 80 },
      { id: "india-6", label: "Rajasthan", answer: "rajasthan", marks: 2, x: 28, y: 41 },
      { id: "india-7", label: "Gujarat", answer: "gujarat", marks: 2, x: 24, y: 55 },
      { id: "india-8", label: "Maharashtra", answer: "maharashtra", marks: 2, x: 33, y: 63 },
      { id: "india-9", label: "Tamil Nadu", answer: "tamil nadu", marks: 2, x: 44, y: 86 },
      { id: "india-10", label: "Assam", answer: "assam", marks: 2, x: 76, y: 36 },
      { id: "india-11", label: "Odisha", answer: "odisha", marks: 2, x: 57, y: 57 },
      { id: "india-12", label: "Kerala", answer: "kerala", marks: 2, x: 38, y: 83 },
    ],
  },
  {
    id: "world-ocean",
    title: "World Ocean Outline Map",
    caption: "Oceans, deserts, continents, countries, and wider world geography.",
    imageUrl: "/maps/world ocean map.jpg",
    practiceImageUrl: "/maps/world ocean empty.webp",
    practiceAspectRatio: "2560 / 1297",
    accent: "#0288d1",
    questions: [
      { id: "ocean-1", label: "Pacific Ocean", answer: "pacific ocean", marks: 2, x: 18, y: 47 },
      { id: "ocean-2", label: "Atlantic Ocean", answer: "atlantic ocean", marks: 2, x: 45, y: 47 },
      { id: "ocean-3", label: "Indian Ocean", answer: "indian ocean", marks: 2, x: 67, y: 57 },
      { id: "ocean-4", label: "Southern Ocean", answer: "southern ocean", marks: 2, x: 50, y: 84 },
      { id: "ocean-5", label: "Arctic Ocean", answer: "arctic ocean", marks: 2, x: 50, y: 14 },
      { id: "ocean-6", label: "North Pacific Ocean", answer: "north pacific ocean", marks: 2, x: 20, y: 34 },
      { id: "ocean-7", label: "South Pacific Ocean", answer: "south pacific ocean", marks: 2, x: 20, y: 64 },
      { id: "ocean-8", label: "North Atlantic Ocean", answer: "north atlantic ocean", marks: 2, x: 45, y: 34 },
      { id: "ocean-9", label: "South Atlantic Ocean", answer: "south atlantic ocean", marks: 2, x: 45, y: 63 },
    ],
  },
];

const MAP_BY_ID = Object.fromEntries(mapPhotos.map((map) => [map.id, map]));
const PRACTICE_QUESTION_COUNT = 5;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-1.5-flash";
const EMPTY_MAP_RESULT = { mapId: "", title: "", subtitle: "", markers: [], suggestedQueries: [] };
const DEFAULT_VIEWPORT = { zoom: 1, focusX: 50, focusY: 50 };
const MIN_ZOOM = 0.85;
const MAX_ZOOM = 1.85;

const SEARCH_SUGGESTIONS = [
  "Show major ports in India",
  "Coal mines in India",
  "Indian states",
  "Mountain ranges in India",
  "World oceans",
  "Deserts",
  "Countries in Asia",
  "Rivers in India",
  "Major dams in India",
  "Indian states and capitals",
  "Thermal power plants in India",
  "World continents",
];

const INDIA_HINTS = [
  "india", "indian", "state", "states", "capital", "capitals", "river", "rivers", "port", "ports",
  "mine", "mines", "coal", "iron", "mountain", "mountains", "range", "ranges", "plateau", "plain",
  "desert", "ghats", "himalaya", "odisha", "telangana", "chhattisgarh", "maharashtra", "assam",
];

const WORLD_HINTS = [
  "world", "ocean", "oceans", "country", "countries", "asia", "africa", "europe", "desert", "pacific",
  "atlantic", "arctic", "southern", "continent", "continents", "global", "japan", "china", "mongolia",
  "latitude", "longitude", "grassland", "climate", "sea route", "mediterranean", "nile", "amazon",
];

const FALLBACK_TOPICS = [
  {
    id: "ports-india",
    title: "Major Ports Of India",
    subtitle: "Important seaports along the western and eastern coasts.",
    mapId: "india",
    triggerTerms: ["port", "ports", "harbour", "harbor", "seaport", "major ports in india"],
    markers: [
      { id: "mumbai", label: "Mumbai", detail: "Major natural harbor on the Arabian Sea.", x: 28, y: 63, labelX: 16, labelY: 63, textAlign: "right" },
      { id: "kandla", label: "Kandla", detail: "Western coast port in Gujarat.", x: 21, y: 51, labelX: 10, labelY: 49, textAlign: "right" },
      { id: "mormugao", label: "Mormugao", detail: "Port in Goa on the Konkan coast.", x: 29, y: 72, labelX: 18, labelY: 74, textAlign: "right" },
      { id: "kochi", label: "Kochi", detail: "Important port on the Malabar Coast.", x: 38, y: 84, labelX: 27, labelY: 86, textAlign: "right" },
      { id: "chennai", label: "Chennai", detail: "Historic artificial harbor on the Coromandel Coast.", x: 48, y: 82, labelX: 61, labelY: 81, textAlign: "left" },
      { id: "visakhapatnam", label: "Visakhapatnam", detail: "Natural harbor on the Bay of Bengal.", x: 58, y: 66, labelX: 69, labelY: 66, textAlign: "left" },
      { id: "paradip", label: "Paradip", detail: "Major port in Odisha.", x: 57, y: 58, labelX: 69, labelY: 57, textAlign: "left" },
      { id: "kolkata", label: "Kolkata", detail: "Riverine port on the Hooghly.", x: 66, y: 48, labelX: 78, labelY: 47, textAlign: "left" },
    ],
  },
  {
    id: "coal-india",
    title: "Coal Mines Of India",
    subtitle: "Key coalfields commonly marked in school atlases.",
    mapId: "india",
    triggerTerms: ["coal", "coal mine", "coal mines", "coalfield", "colliery", "lignite"],
    markers: [
      { id: "jharia", label: "Jharia", detail: "Coalfield in Jharkhand near Dhanbad.", x: 59, y: 49.5, labelX: 71, labelY: 44.5, textAlign: "left" },
      { id: "raniganj", label: "Raniganj", detail: "Coalfield in West Bengal.", x: 62.5, y: 48.5, labelX: 78, labelY: 49, textAlign: "left" },
      { id: "bokaro", label: "Bokaro", detail: "Coalfield and steel belt in Jharkhand.", x: 56, y: 46, labelX: 65, labelY: 39.5, textAlign: "left" },
      { id: "singrauli", label: "Singrauli", detail: "Coalfield on the MP-UP border.", x: 51, y: 50.5, labelX: 40, labelY: 39, textAlign: "right" },
      { id: "korba", label: "Korba", detail: "Important coal mining region in Chhattisgarh.", x: 45, y: 56, labelX: 30, labelY: 56, textAlign: "right" },
      { id: "talcher", label: "Talcher", detail: "Coalfield in Odisha.", x: 54, y: 60.5, labelX: 68, labelY: 61, textAlign: "left" },
      { id: "singareni", label: "Singareni", detail: "Coalfield in Telangana.", x: 50, y: 71, labelX: 64, labelY: 71, textAlign: "left" },
      { id: "neyveli", label: "Neyveli", detail: "Lignite mining area in Tamil Nadu.", x: 45, y: 82, labelX: 33, labelY: 84, textAlign: "right" },
    ],
  },
  {
    id: "rivers-india",
    title: "Major Rivers Of India",
    subtitle: "Classroom-ready river origins and flows.",
    mapId: "india",
    triggerTerms: ["river", "rivers", "ganga", "yamuna", "godavari", "krishna", "narmada", "brahmaputra"],
    markers: [
      { id: "ganga", label: "Ganga", detail: "Northern plains river flowing eastwards.", x: 50, y: 33, labelX: 37, labelY: 30, textAlign: "right", type: "path" },
      { id: "yamuna", label: "Yamuna", detail: "Major tributary of the Ganga.", x: 43, y: 34, labelX: 31, labelY: 34, textAlign: "right", type: "path" },
      { id: "brahmaputra", label: "Brahmaputra", detail: "Great river of northeast India.", x: 78, y: 33, labelX: 89, labelY: 31, textAlign: "left", type: "path" },
      { id: "narmada", label: "Narmada", detail: "West-flowing river through central India.", x: 36, y: 56, labelX: 22, labelY: 54, textAlign: "right", type: "path" },
      { id: "godavari", label: "Godavari", detail: "Long east-flowing peninsular river.", x: 45, y: 66, labelX: 30, labelY: 68, textAlign: "right", type: "path" },
      { id: "krishna", label: "Krishna", detail: "Important river of peninsular India.", x: 41, y: 72, labelX: 26, labelY: 74, textAlign: "right", type: "path" },
    ],
  },
  {
    id: "states-india",
    title: "Important States Of India",
    subtitle: "Representative state locations for quick revision.",
    mapId: "india",
    triggerTerms: ["state", "states", "indian states", "rajasthan", "gujarat", "maharashtra", "tamil nadu", "assam", "odisha"],
    markers: [
      { id: "rajasthan", label: "Rajasthan", detail: "Largest Indian state by area.", x: 26, y: 40, labelX: 13, labelY: 39, textAlign: "right" },
      { id: "gujarat", label: "Gujarat", detail: "Western coastal state on the Arabian Sea.", x: 25, y: 53, labelX: 11, labelY: 54, textAlign: "right" },
      { id: "maharashtra", label: "Maharashtra", detail: "State containing Mumbai.", x: 36, y: 60, labelX: 22, labelY: 61, textAlign: "right" },
      { id: "madhya-pradesh", label: "Madhya Pradesh", detail: "Central Indian state.", x: 41, y: 51, labelX: 23, labelY: 49, textAlign: "right" },
      { id: "west-bengal", label: "West Bengal", detail: "Eastern state near the Bay of Bengal.", x: 64, y: 47, labelX: 79, labelY: 43, textAlign: "left" },
      { id: "odisha", label: "Odisha", detail: "Eastern coastal state.", x: 57, y: 56, labelX: 69, labelY: 56, textAlign: "left" },
      { id: "tamil-nadu", label: "Tamil Nadu", detail: "Southern state facing the Bay of Bengal.", x: 45, y: 83, labelX: 59, labelY: 84, textAlign: "left" },
      { id: "assam", label: "Assam", detail: "Northeastern state in the Brahmaputra Valley.", x: 76, y: 36, labelX: 88, labelY: 36, textAlign: "left" },
    ],
  },
  {
    id: "states-capitals-india",
    title: "Indian States And Capitals",
    subtitle: "Important school-level capital locations across India.",
    mapId: "india",
    triggerTerms: ["states and capitals", "indian capitals", "state capitals", "capitals of india", "capitals"],
    markers: [
      { id: "jaipur", label: "Jaipur", detail: "Capital of Rajasthan.", x: 31, y: 40, labelX: 18, labelY: 38, textAlign: "right", aliases: ["rajasthan capital"] },
      { id: "gandhinagar", label: "Gandhinagar", detail: "Capital of Gujarat.", x: 25, y: 51, labelX: 13, labelY: 49, textAlign: "right", aliases: ["gujarat capital"] },
      { id: "mumbai-capital", label: "Mumbai", detail: "Capital of Maharashtra.", x: 30, y: 63, labelX: 18, labelY: 63, textAlign: "right", aliases: ["maharashtra capital"] },
      { id: "bhopal", label: "Bhopal", detail: "Capital of Madhya Pradesh.", x: 42, y: 51, labelX: 29, labelY: 48, textAlign: "right", aliases: ["mp capital"] },
      { id: "lucknow", label: "Lucknow", detail: "Capital of Uttar Pradesh.", x: 50, y: 37, labelX: 63, labelY: 35, textAlign: "left", aliases: ["up capital"] },
      { id: "kolkata-capital", label: "Kolkata", detail: "Capital of West Bengal.", x: 66, y: 48, labelX: 79, labelY: 47, textAlign: "left", aliases: ["west bengal capital"] },
      { id: "bhubaneswar", label: "Bhubaneswar", detail: "Capital of Odisha.", x: 58, y: 57, labelX: 70, labelY: 55, textAlign: "left", aliases: ["odisha capital"] },
      { id: "chennai-capital", label: "Chennai", detail: "Capital of Tamil Nadu.", x: 48, y: 82, labelX: 60, labelY: 80, textAlign: "left", aliases: ["tamil nadu capital"] },
      { id: "hyderabad-capital", label: "Hyderabad", detail: "Capital of Telangana.", x: 45, y: 66, labelX: 58, labelY: 66, textAlign: "left", aliases: ["telangana capital"] },
      { id: "dispur", label: "Dispur", detail: "Capital of Assam.", x: 78, y: 35, labelX: 88, labelY: 33, textAlign: "left", aliases: ["assam capital", "guwahati"] },
    ],
  },
  {
    id: "mountains-india",
    title: "Mountain Ranges Of India",
    subtitle: "Key mountain systems and hill ranges.",
    mapId: "india",
    triggerTerms: ["mountain", "mountains", "mountain range", "mountain ranges", "himalaya", "western ghats", "eastern ghats", "aravalli"],
    markers: [
      { id: "himalaya", label: "Himalayas", detail: "Young fold mountains across the north.", x: 47, y: 21, labelX: 64, labelY: 16, textAlign: "left", type: "region", width: 30, height: 10 },
      { id: "aravalli", label: "Aravalli", detail: "Old fold mountains in western India.", x: 28, y: 43, labelX: 15, labelY: 45, textAlign: "right", type: "path" },
      { id: "vindhya", label: "Vindhya", detail: "Range in central India.", x: 40, y: 53, labelX: 24, labelY: 53, textAlign: "right", type: "path" },
      { id: "western-ghats", label: "Western Ghats", detail: "Mountain chain along the western coast.", x: 34, y: 72, labelX: 16, labelY: 72, textAlign: "right", type: "path" },
      { id: "eastern-ghats", label: "Eastern Ghats", detail: "Discontinuous ranges along the eastern coast.", x: 53, y: 70, labelX: 67, labelY: 70, textAlign: "left", type: "path" },
      { id: "nilgiri", label: "Nilgiri", detail: "Hill region where the Western and Eastern Ghats meet.", x: 39, y: 81, labelX: 24, labelY: 81, textAlign: "right" },
    ],
  },
  {
    id: "plateaus-plains-india",
    title: "Plateaus And Plains Of India",
    subtitle: "Major physiographic divisions asked in Classes 8 to 10.",
    mapId: "india",
    triggerTerms: ["plateau", "plateaus", "plain", "plains", "deccan plateau", "northern plains", "malwa plateau", "chota nagpur"],
    markers: [
      { id: "northern-plains", label: "Northern Plains", detail: "Fertile alluvial plain from Punjab to Assam.", x: 49, y: 31, labelX: 64, labelY: 27, textAlign: "left", type: "region", width: 28, height: 8 },
      { id: "deccan-plateau", label: "Deccan Plateau", detail: "Triangular plateau of peninsular India.", x: 43, y: 67, labelX: 24, labelY: 66, textAlign: "right", type: "region", width: 24, height: 20 },
      { id: "malwa-plateau", label: "Malwa", detail: "Plateau region in western Madhya Pradesh.", x: 35, y: 51, labelX: 21, labelY: 49, textAlign: "right", type: "region", width: 10, height: 7 },
      { id: "chota-nagpur", label: "Chota Nagpur", detail: "Mineral-rich plateau in Jharkhand.", x: 58, y: 49, labelX: 72, labelY: 47, textAlign: "left", type: "region", width: 10, height: 7 },
    ],
  },
  {
    id: "dams-india",
    title: "Major Dams Of India",
    subtitle: "Important water resource projects for school map practice.",
    mapId: "india",
    triggerTerms: ["dam", "dams", "water resources", "bhakra", "hirakud", "nagarjuna sagar", "tehri", "sardar sarovar"],
    markers: [
      { id: "bhakra", label: "Bhakra Nangal", detail: "Major dam on the Sutlej.", x: 37, y: 22, labelX: 20, labelY: 20, textAlign: "right" },
      { id: "tehri", label: "Tehri", detail: "Dam in Uttarakhand on the Bhagirathi.", x: 42, y: 24, labelX: 56, labelY: 21, textAlign: "left" },
      { id: "sardar-sarovar", label: "Sardar Sarovar", detail: "Dam on the Narmada in Gujarat.", x: 27, y: 56, labelX: 11, labelY: 58, textAlign: "right" },
      { id: "hirakud", label: "Hirakud", detail: "Long earthen dam in Odisha.", x: 54, y: 55, labelX: 67, labelY: 53, textAlign: "left" },
      { id: "nagarjuna-sagar", label: "Nagarjuna Sagar", detail: "Large masonry dam in Telangana-Andhra region.", x: 47, y: 68, labelX: 63, labelY: 67, textAlign: "left" },
      { id: "tungabhadra", label: "Tungabhadra", detail: "Dam project in Karnataka.", x: 38, y: 73, labelX: 20, labelY: 73, textAlign: "right" },
    ],
  },
  {
    id: "minerals-india",
    title: "Minerals And Resources Of India",
    subtitle: "Major iron ore, bauxite, mica, and manganese regions.",
    mapId: "india",
    triggerTerms: ["mineral", "minerals", "resources", "iron ore", "bauxite", "mica", "manganese", "natural resources"],
    markers: [
      { id: "noamundi", label: "Noamundi", detail: "Important iron ore belt in Jharkhand.", x: 58, y: 51, labelX: 71, labelY: 51, textAlign: "left", aliases: ["iron ore jharkhand"] },
      { id: "bailadila", label: "Bailadila", detail: "Iron ore range in Chhattisgarh.", x: 50, y: 61, labelX: 35, labelY: 61, textAlign: "right", aliases: ["iron ore chhattisgarh"] },
      { id: "koraput", label: "Koraput", detail: "Bauxite area in Odisha.", x: 54, y: 63, labelX: 68, labelY: 63, textAlign: "left", aliases: ["bauxite odisha"] },
      { id: "koderma", label: "Koderma", detail: "Historic mica belt in Jharkhand.", x: 56, y: 45, labelX: 69, labelY: 42, textAlign: "left", aliases: ["mica"] },
      { id: "nagpur", label: "Nagpur Belt", detail: "Manganese-rich central Indian belt.", x: 41, y: 59, labelX: 24, labelY: 58, textAlign: "right", aliases: ["manganese"] },
    ],
  },
  {
    id: "agriculture-india",
    title: "Agriculture Crops Of India",
    subtitle: "Major regions for rice, wheat, cotton, tea, and coffee.",
    mapId: "india",
    triggerTerms: ["agriculture", "crop", "crops", "wheat", "rice", "cotton", "tea", "coffee", "agriculture regions"],
    markers: [
      { id: "wheat-belt", label: "Wheat Belt", detail: "Punjab-Haryana-western UP region.", x: 40, y: 29, labelX: 23, labelY: 28, textAlign: "right", type: "region", width: 18, height: 8 },
      { id: "rice-east", label: "Rice Belt", detail: "Eastern and coastal rice-growing region.", x: 58, y: 52, labelX: 73, labelY: 50, textAlign: "left", type: "region", width: 20, height: 18 },
      { id: "cotton-deccan", label: "Cotton Belt", detail: "Black soil region of Gujarat and Deccan.", x: 34, y: 61, labelX: 16, labelY: 62, textAlign: "right", type: "region", width: 18, height: 12 },
      { id: "tea-assam", label: "Tea", detail: "Tea plantations in Assam.", x: 79, y: 34, labelX: 88, labelY: 31, textAlign: "left" },
      { id: "coffee-karnataka", label: "Coffee", detail: "Coffee plantations in Karnataka hills.", x: 35, y: 79, labelX: 18, labelY: 79, textAlign: "right" },
    ],
  },
  {
    id: "industries-india",
    title: "Manufacturing Industries Of India",
    subtitle: "Important industrial centres for iron and steel, textiles, and engineering.",
    mapId: "india",
    triggerTerms: ["industry", "industries", "manufacturing", "industrial region", "engineering", "textile", "iron and steel"],
    markers: [
      { id: "ahmedabad", label: "Ahmedabad", detail: "Important textile centre.", x: 26, y: 55, labelX: 12, labelY: 56, textAlign: "right" },
      { id: "mumbai-industry", label: "Mumbai", detail: "Engineering, petrochemical, and textile centre.", x: 29, y: 63, labelX: 15, labelY: 64, textAlign: "right" },
      { id: "jamshedpur-industry", label: "Jamshedpur", detail: "Major iron and steel centre.", x: 58, y: 49, labelX: 71, labelY: 46, textAlign: "left" },
      { id: "bokaro-industry", label: "Bokaro", detail: "Integrated steel plant region.", x: 56, y: 46, labelX: 67, labelY: 40, textAlign: "left" },
      { id: "rourkela-industry", label: "Rourkela", detail: "Steel industry centre in Odisha.", x: 54, y: 52, labelX: 67, labelY: 52, textAlign: "left" },
      { id: "chennai-industry", label: "Chennai", detail: "Automobile and engineering hub.", x: 48, y: 82, labelX: 61, labelY: 82, textAlign: "left" },
    ],
  },
  {
    id: "power-plants-india",
    title: "Thermal And Nuclear Power Plants",
    subtitle: "Major power generation locations commonly taught in Class 10.",
    mapId: "india",
    triggerTerms: ["power plant", "power plants", "thermal", "nuclear", "atomic", "electricity", "energy"],
    markers: [
      { id: "singrauli-power", label: "Singrauli", detail: "Thermal power hub.", x: 51, y: 50.5, labelX: 38, labelY: 40, textAlign: "right", aliases: ["thermal power"] },
      { id: "korba-power", label: "Korba", detail: "Thermal power centre in Chhattisgarh.", x: 45, y: 56, labelX: 30, labelY: 56, textAlign: "right" },
      { id: "talcher-power", label: "Talcher", detail: "Thermal station in Odisha.", x: 54, y: 60.5, labelX: 68, labelY: 60, textAlign: "left" },
      { id: "tarapur", label: "Tarapur", detail: "Nuclear power station in Maharashtra.", x: 29, y: 61, labelX: 15, labelY: 59, textAlign: "right" },
      { id: "kalpakkam", label: "Kalpakkam", detail: "Nuclear power station near Chennai.", x: 49, y: 83, labelX: 62, labelY: 85, textAlign: "left" },
      { id: "kudankulam", label: "Kudankulam", detail: "Nuclear power station in Tamil Nadu.", x: 43, y: 90, labelX: 57, labelY: 91, textAlign: "left" },
    ],
  },
  {
    id: "national-parks-india",
    title: "National Parks Of India",
    subtitle: "Important wildlife regions for school geography and environment links.",
    mapId: "india",
    triggerTerms: ["national park", "national parks", "forest", "wildlife", "jim corbett", "kaziranga", "gir", "sundarbans"],
    markers: [
      { id: "jim-corbett", label: "Jim Corbett", detail: "National park in Uttarakhand.", x: 43, y: 26, labelX: 57, labelY: 24, textAlign: "left" },
      { id: "gir", label: "Gir", detail: "Asiatic lion habitat in Gujarat.", x: 23, y: 57, labelX: 10, labelY: 59, textAlign: "right" },
      { id: "kanha", label: "Kanha", detail: "Tiger reserve in Madhya Pradesh.", x: 45, y: 54, labelX: 29, labelY: 53, textAlign: "right" },
      { id: "kaziranga", label: "Kaziranga", detail: "Rhino habitat in Assam.", x: 79, y: 35, labelX: 89, labelY: 37, textAlign: "left" },
      { id: "sundarbans", label: "Sundarbans", detail: "Mangrove delta forest in West Bengal.", x: 67, y: 50, labelX: 80, labelY: 52, textAlign: "left" },
    ],
  },
  {
    id: "transport-india",
    title: "Transport Networks Of India",
    subtitle: "Major corridors linking important Indian cities and ports.",
    mapId: "india",
    triggerTerms: ["transport", "railway", "road", "golden quadrilateral", "network", "corridor"],
    markers: [
      { id: "delhi", label: "Delhi", detail: "Northern transport node.", x: 42, y: 31, labelX: 28, labelY: 29, textAlign: "right" },
      { id: "mumbai-network", label: "Mumbai", detail: "Western coastal transport hub.", x: 29, y: 63, labelX: 15, labelY: 65, textAlign: "right" },
      { id: "chennai-network", label: "Chennai", detail: "Southern gateway port and rail hub.", x: 48, y: 82, labelX: 62, labelY: 82, textAlign: "left" },
      { id: "kolkata-network", label: "Kolkata", detail: "Eastern rail and river port hub.", x: 66, y: 48, labelX: 80, labelY: 47, textAlign: "left" },
      { id: "gq", label: "Golden Quadrilateral", detail: "Major highway network joining Delhi, Mumbai, Chennai, and Kolkata.", x: 46, y: 56, labelX: 63, labelY: 60, textAlign: "left", type: "region", width: 32, height: 28 },
    ],
  },
  {
    id: "soils-india",
    title: "Soil Types Of India",
    subtitle: "Alluvial, black, red, laterite, and desert soil belts.",
    mapId: "india",
    triggerTerms: ["soil", "soils", "alluvial", "black soil", "red soil", "laterite", "desert soil"],
    markers: [
      { id: "alluvial", label: "Alluvial", detail: "Northern plain soil belt.", x: 49, y: 31, labelX: 64, labelY: 29, textAlign: "left", type: "region", width: 28, height: 8 },
      { id: "black", label: "Black Soil", detail: "Cotton-growing Deccan trap belt.", x: 37, y: 64, labelX: 18, labelY: 64, textAlign: "right", type: "region", width: 18, height: 14 },
      { id: "red", label: "Red Soil", detail: "Large peninsular spread in south and east.", x: 50, y: 69, labelX: 66, labelY: 69, textAlign: "left", type: "region", width: 22, height: 16 },
      { id: "desert-soil", label: "Desert Soil", detail: "Arid western India.", x: 24, y: 41, labelX: 10, labelY: 41, textAlign: "right", type: "region", width: 10, height: 8 },
    ],
  },
  {
    id: "forest-regions-india",
    title: "Forest Regions Of India",
    subtitle: "Important evergreen, deciduous, and mangrove forest areas.",
    mapId: "india",
    triggerTerms: ["forest regions", "forest", "evergreen", "deciduous", "mangrove", "forest types"],
    markers: [
      { id: "western-ghats-forest", label: "Evergreen", detail: "Dense forests along the Western Ghats.", x: 33, y: 77, labelX: 16, labelY: 77, textAlign: "right", type: "region", width: 9, height: 18 },
      { id: "central-deciduous", label: "Deciduous", detail: "Large central Indian forest belt.", x: 44, y: 57, labelX: 28, labelY: 57, textAlign: "right", type: "region", width: 22, height: 16 },
      { id: "sundarban-forest", label: "Mangrove", detail: "Mangrove forests in the Sundarbans.", x: 67, y: 50, labelX: 80, labelY: 51, textAlign: "left", type: "region", width: 7, height: 6 },
    ],
  },
  {
    id: "world-oceans",
    title: "World Oceans",
    subtitle: "The five major oceans of the world.",
    mapId: "world-ocean",
    triggerTerms: ["ocean", "oceans", "world oceans", "sea", "pacific ocean", "atlantic ocean", "indian ocean", "arctic ocean", "southern ocean"],
    markers: [
      { id: "pacific-ocean", label: "Pacific Ocean", detail: "Largest ocean basin on Earth.", x: 18, y: 47, labelX: 8, labelY: 47, textAlign: "right", type: "region", width: 18, height: 28 },
      { id: "atlantic-ocean", label: "Atlantic Ocean", detail: "Ocean between the Americas and Europe-Africa.", x: 45, y: 47, labelX: 33, labelY: 47, textAlign: "right", type: "region", width: 14, height: 24 },
      { id: "indian-ocean", label: "Indian Ocean", detail: "Ocean south of Asia and west of Australia.", x: 67, y: 57, labelX: 56, labelY: 57, textAlign: "right", type: "region", width: 16, height: 22 },
      { id: "southern-ocean", label: "Southern Ocean", detail: "Ocean circling Antarctica.", x: 50, y: 84, labelX: 64, labelY: 83, textAlign: "left", type: "region", width: 42, height: 10 },
      { id: "arctic-ocean", label: "Arctic Ocean", detail: "Smallest and shallowest ocean around the North Pole.", x: 50, y: 14, labelX: 63, labelY: 14, textAlign: "left", type: "region", width: 25, height: 12 },
    ],
  },
  {
    id: "deserts-world",
    title: "Major Deserts Of The World",
    subtitle: "Important desert regions frequently asked in geography practice.",
    mapId: "world-ocean",
    triggerTerms: ["desert", "deserts", "sahara", "arabian desert", "gobi", "kalahari", "thar desert"],
    markers: [
      { id: "sahara", label: "Sahara", detail: "Hot desert across North Africa.", x: 49, y: 42, labelX: 37, labelY: 40, textAlign: "right", type: "region", width: 15, height: 10 },
      { id: "arabian", label: "Arabian", detail: "Large desert region of the Arabian Peninsula.", x: 58, y: 43, labelX: 70, labelY: 43, textAlign: "left", type: "region", width: 8, height: 8 },
      { id: "gobi", label: "Gobi", detail: "Cold desert in Mongolia and northern China.", x: 76, y: 34, labelX: 87, labelY: 33, textAlign: "left", type: "region", width: 9, height: 8 },
      { id: "kalahari", label: "Kalahari", detail: "Desert in southern Africa.", x: 54, y: 68, labelX: 66, labelY: 67, textAlign: "left", type: "region", width: 8, height: 8 },
      { id: "thar", label: "Thar", detail: "Desert in northwestern India and Pakistan.", x: 63, y: 44, labelX: 74, labelY: 45, textAlign: "left", type: "region", width: 6, height: 6 },
    ],
  },
  {
    id: "asia-countries",
    title: "Countries In Asia",
    subtitle: "A revision set of major Asian countries.",
    mapId: "world-ocean",
    triggerTerms: ["asia", "countries in asia", "asian countries", "japan", "china", "india", "saudi arabia", "mongolia"],
    markers: [
      { id: "india-asia", label: "India", detail: "South Asian country extending into the Indian Ocean.", x: 64, y: 49, labelX: 73, labelY: 49, textAlign: "left" },
      { id: "china", label: "China", detail: "Large East Asian country.", x: 75, y: 36, labelX: 86, labelY: 36, textAlign: "left" },
      { id: "japan", label: "Japan", detail: "Island country in East Asia.", x: 86, y: 37, labelX: 92, labelY: 33, textAlign: "left" },
      { id: "saudi-arabia", label: "Saudi Arabia", detail: "Country covering much of the Arabian Peninsula.", x: 59, y: 43, labelX: 70, labelY: 39, textAlign: "left" },
      { id: "mongolia", label: "Mongolia", detail: "Landlocked country north of China.", x: 76, y: 29, labelX: 87, labelY: 26, textAlign: "left" },
      { id: "indonesia", label: "Indonesia", detail: "Archipelagic country in Southeast Asia.", x: 79, y: 56, labelX: 90, labelY: 58, textAlign: "left" },
    ],
  },
  {
    id: "continents-world",
    title: "World Continents",
    subtitle: "The seven major continents for Class 8 geography.",
    mapId: "world-ocean",
    triggerTerms: ["continent", "continents", "world continents", "locate continents"],
    markers: [
      { id: "asia", label: "Asia", detail: "Largest continent.", x: 72, y: 34, labelX: 84, labelY: 30, textAlign: "left", type: "region", width: 22, height: 18 },
      { id: "africa", label: "Africa", detail: "Continent straddling the equator.", x: 51, y: 53, labelX: 38, labelY: 52, textAlign: "right", type: "region", width: 12, height: 22 },
      { id: "europe", label: "Europe", detail: "Western Eurasian continent.", x: 52, y: 28, labelX: 39, labelY: 26, textAlign: "right", type: "region", width: 10, height: 8 },
      { id: "north-america", label: "North America", detail: "Northern continent of the Americas.", x: 20, y: 32, labelX: 8, labelY: 28, textAlign: "right", type: "region", width: 18, height: 18 },
      { id: "south-america", label: "South America", detail: "Southern continent of the Americas.", x: 31, y: 63, labelX: 18, labelY: 65, textAlign: "right", type: "region", width: 12, height: 18 },
      { id: "australia", label: "Australia", detail: "Small continent in the Southern Hemisphere.", x: 82, y: 68, labelX: 92, labelY: 69, textAlign: "left", type: "region", width: 12, height: 10 },
      { id: "antarctica", label: "Antarctica", detail: "Frozen southern continent.", x: 50, y: 90, labelX: 64, labelY: 91, textAlign: "left", type: "region", width: 40, height: 8 },
    ],
  },
  {
    id: "countries-world",
    title: "Important Countries Of The World",
    subtitle: "School-level country revision across major regions.",
    mapId: "world-ocean",
    triggerTerms: ["important countries", "countries", "world countries", "usa", "brazil", "australia", "egypt", "india", "china"],
    markers: [
      { id: "usa", label: "USA", detail: "Country in North America.", x: 19, y: 35, labelX: 8, labelY: 34, textAlign: "right" },
      { id: "brazil", label: "Brazil", detail: "Largest country in South America.", x: 33, y: 62, labelX: 20, labelY: 63, textAlign: "right" },
      { id: "egypt", label: "Egypt", detail: "Country in northeast Africa.", x: 55, y: 43, labelX: 67, labelY: 41, textAlign: "left" },
      { id: "india-world", label: "India", detail: "Major South Asian country.", x: 64, y: 49, labelX: 75, labelY: 49, textAlign: "left" },
      { id: "china-world", label: "China", detail: "East Asian country.", x: 75, y: 36, labelX: 86, labelY: 36, textAlign: "left" },
      { id: "australia-country", label: "Australia", detail: "Country-continent in Oceania.", x: 82, y: 69, labelX: 92, labelY: 71, textAlign: "left" },
    ],
  },
  {
    id: "mountains-world",
    title: "Major Mountains Of The World",
    subtitle: "Important mountain systems across continents.",
    mapId: "world-ocean",
    triggerTerms: ["world mountains", "mountains of the world", "andes", "rockies", "alps", "himalayas", "mountains"],
    markers: [
      { id: "rockies", label: "Rockies", detail: "Mountain system in western North America.", x: 17, y: 31, labelX: 7, labelY: 29, textAlign: "right", type: "path" },
      { id: "andes", label: "Andes", detail: "Long mountain chain in western South America.", x: 28, y: 67, labelX: 16, labelY: 70, textAlign: "right", type: "path" },
      { id: "alps", label: "Alps", detail: "Mountain system in Europe.", x: 51, y: 30, labelX: 40, labelY: 28, textAlign: "right", type: "path" },
      { id: "himalaya-world", label: "Himalayas", detail: "Great fold mountain system of Asia.", x: 68, y: 31, labelX: 80, labelY: 27, textAlign: "left", type: "path" },
    ],
  },
  {
    id: "rivers-world",
    title: "Major Rivers Of The World",
    subtitle: "Important global rivers from standard school geography.",
    mapId: "world-ocean",
    triggerTerms: ["world rivers", "rivers of the world", "nile", "amazon", "mississippi", "yangtze", "danube"],
    markers: [
      { id: "nile", label: "Nile", detail: "Major river flowing north through Africa.", x: 55, y: 49, labelX: 67, labelY: 49, textAlign: "left", type: "path" },
      { id: "amazon", label: "Amazon", detail: "Large equatorial river in South America.", x: 31, y: 58, labelX: 18, labelY: 58, textAlign: "right", type: "path" },
      { id: "mississippi", label: "Mississippi", detail: "Major river system in North America.", x: 24, y: 42, labelX: 10, labelY: 43, textAlign: "right", type: "path" },
      { id: "yangtze", label: "Yangtze", detail: "Long river in China.", x: 77, y: 39, labelX: 88, labelY: 40, textAlign: "left", type: "path" },
    ],
  },
  {
    id: "grasslands-world",
    title: "Major Grasslands Of The World",
    subtitle: "Prairies, Pampas, Velds, and Steppes.",
    mapId: "world-ocean",
    triggerTerms: ["grassland", "grasslands", "prairies", "pampas", "veld", "steppes"],
    markers: [
      { id: "prairies", label: "Prairies", detail: "Temperate grasslands of North America.", x: 23, y: 37, labelX: 10, labelY: 37, textAlign: "right", type: "region", width: 12, height: 8 },
      { id: "pampas", label: "Pampas", detail: "Grasslands of Argentina and Uruguay.", x: 30, y: 72, labelX: 17, labelY: 74, textAlign: "right", type: "region", width: 10, height: 8 },
      { id: "velds", label: "Velds", detail: "Grasslands of South Africa.", x: 54, y: 72, labelX: 66, labelY: 73, textAlign: "left", type: "region", width: 8, height: 6 },
      { id: "steppes", label: "Steppes", detail: "Temperate grasslands across Eurasia.", x: 63, y: 28, labelX: 76, labelY: 24, textAlign: "left", type: "region", width: 18, height: 6 },
    ],
  },
  {
    id: "climate-world",
    title: "Climate Regions Of The World",
    subtitle: "Equatorial, desert, Mediterranean, and tundra regions.",
    mapId: "world-ocean",
    triggerTerms: ["climate", "climate regions", "equatorial", "mediterranean", "tundra", "hot desert"],
    markers: [
      { id: "equatorial", label: "Equatorial", detail: "Hot wet climate near the equator.", x: 50, y: 56, labelX: 37, labelY: 57, textAlign: "right", type: "region", width: 28, height: 8 },
      { id: "mediterranean", label: "Mediterranean", detail: "Warm temperate western margin climate.", x: 50, y: 35, labelX: 37, labelY: 33, textAlign: "right", type: "region", width: 10, height: 7 },
      { id: "hot-desert", label: "Hot Desert", detail: "Dry subtropical belt including Sahara and Arabian.", x: 53, y: 42, labelX: 67, labelY: 38, textAlign: "left", type: "region", width: 24, height: 10 },
      { id: "tundra", label: "Tundra", detail: "Polar climate around Arctic margins.", x: 50, y: 11, labelX: 63, labelY: 10, textAlign: "left", type: "region", width: 38, height: 8 },
    ],
  },
  {
    id: "latitudes-world",
    title: "Latitudes And Longitudes",
    subtitle: "Important world reference lines used in mapwork.",
    mapId: "world-ocean",
    triggerTerms: ["latitude", "latitudes", "longitude", "longitudes", "equator", "tropic of cancer", "tropic of capricorn", "prime meridian"],
    markers: [
      { id: "equator", label: "Equator", detail: "0° latitude.", x: 50, y: 50, labelX: 62, labelY: 50, textAlign: "left", type: "region", width: 55, height: 4 },
      { id: "tropic-cancer", label: "Tropic of Cancer", detail: "23.5° N latitude.", x: 50, y: 40, labelX: 66, labelY: 38, textAlign: "left", type: "region", width: 52, height: 4 },
      { id: "tropic-capricorn", label: "Tropic of Capricorn", detail: "23.5° S latitude.", x: 50, y: 60, labelX: 68, labelY: 62, textAlign: "left", type: "region", width: 52, height: 4 },
      { id: "prime-meridian", label: "Prime Meridian", detail: "0° longitude through Greenwich.", x: 47, y: 34, labelX: 35, labelY: 30, textAlign: "right", type: "region", width: 4, height: 56 },
    ],
  },
  {
    id: "sea-routes-world",
    title: "Major Sea Routes And Water Bodies",
    subtitle: "Key canals, seas, and oceanic routes of world trade.",
    mapId: "world-ocean",
    triggerTerms: ["sea route", "sea routes", "suez canal", "panama canal", "mediterranean sea", "red sea", "water bodies"],
    markers: [
      { id: "mediterranean-sea", label: "Mediterranean", detail: "Sea between Europe and Africa.", x: 50, y: 37, labelX: 37, labelY: 36, textAlign: "right", type: "region", width: 10, height: 6 },
      { id: "red-sea", label: "Red Sea", detail: "Important sea route near Suez.", x: 56, y: 44, labelX: 68, labelY: 45, textAlign: "left", type: "region", width: 5, height: 10 },
      { id: "suez", label: "Suez Canal", detail: "Route linking Mediterranean and Red Sea.", x: 55, y: 41, labelX: 67, labelY: 39, textAlign: "left" },
      { id: "panama", label: "Panama Canal", detail: "Route linking Atlantic and Pacific.", x: 25, y: 49, labelX: 10, labelY: 49, textAlign: "right" },
    ],
  },
];

function selectPracticeQuestions(questions, round) {
  return [...questions]
    .sort((left, right) => {
      const leftScore = (questions.indexOf(left) * 7 + round * 3) % questions.length;
      const rightScore = (questions.indexOf(right) * 7 + round * 3) % questions.length;
      return leftScore - rightScore;
    })
    .slice(0, PRACTICE_QUESTION_COUNT);
}

function normalizeAnswer(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveAssetUrl(url = "") {
  if (!url) return "";
  if (/^(https?:)?\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }

  const basePath = (import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
  const assetPath = url.startsWith("/") ? url.slice(1) : url;
  return encodeURI(`${basePath}${assetPath}`);
}

function extractMeaningfulTerms(query = "") {
  const ignoredTerms = new Set([
    "where", "what", "which", "show", "mark", "locate", "location", "locations", "find", "tell", "me",
    "is", "are", "the", "in", "of", "on", "for", "to", "with", "and", "map", "maps", "major", "outline",
    "student", "students", "question", "questions", "practice", "place", "places",
  ]);

  return normalizeAnswer(query)
    .split(" ")
    .filter((term) => term && !ignoredTerms.has(term));
}

function matchesLoosePhrase(haystack = "", needle = "") {
  const normalizedHaystack = normalizeAnswer(haystack);
  const normalizedNeedle = normalizeAnswer(needle);
  if (!normalizedHaystack || !normalizedNeedle) return false;
  if (normalizedHaystack.includes(normalizedNeedle)) return true;

  const needleTerms = normalizedNeedle.split(" ").filter(Boolean);
  return needleTerms.length > 1 && needleTerms.every((term) => normalizedHaystack.includes(term));
}

function markerSearchText(marker) {
  return [
    marker.label,
    marker.detail,
    ...(marker.aliases || []),
  ]
    .filter(Boolean)
    .join(" ");
}

function inferMapIdFromQuery(query) {
  const normalized = normalizeAnswer(query);
  const indiaScore = INDIA_HINTS.filter((term) => normalized.includes(term)).length;
  const worldScore = WORLD_HINTS.filter((term) => normalized.includes(term)).length;

  if (indiaScore === 0 && worldScore === 0) return "";
  return indiaScore >= worldScore ? "india" : "world-ocean";
}

function tryParseJson(rawText) {
  if (!rawText) return null;

  try {
    return JSON.parse(rawText);
  } catch {
    const fencedMatch = String(rawText).match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fencedMatch?.[1]) {
      try {
        return JSON.parse(fencedMatch[1].trim());
      } catch {
        return null;
      }
    }
  }

  return null;
}

function isEnglishOnlyText(value) {
  return /^[\x00-\x7F]*$/.test(String(value || ""));
}

function buildFallbackSummary() {
  return FALLBACK_TOPICS.map((topic) => ({
    id: topic.id,
    title: topic.title,
    mapId: topic.mapId,
    subtitle: topic.subtitle,
    triggerTerms: topic.triggerTerms,
    markers: topic.markers.map((marker) => ({
      id: marker.id,
      label: marker.label,
      detail: marker.detail,
      x: marker.x,
      y: marker.y,
      labelX: marker.labelX,
      labelY: marker.labelY,
      textAlign: marker.textAlign,
      type: marker.type || "point",
      width: marker.width || null,
      height: marker.height || null,
    })),
  }));
}

function buildMapSearchPrompt(query) {
  return `You are a school geography map assistant.

Your job:
- Understand a student's geography search.
- Choose the correct map.
- Return only accurate markers or highlighted regions suitable for an educational outline map.

Map ids:
- "india" for India-only questions
- "world-ocean" for world oceans, continents, countries, deserts, or global questions

Response format:
{
  "mapId": "india",
  "title": "Major Ports Of India",
  "subtitle": "Short textbook-style description",
  "suggestedQueries": ["Rivers in India", "Mountain ranges in India"],
  "markers": [
    {
      "id": "mumbai",
      "label": "Mumbai",
      "detail": "Short hover description",
      "x": 28,
      "y": 63,
      "labelX": 16,
      "labelY": 63,
      "textAlign": "right",
      "type": "point",
      "width": null,
      "height": null
    }
  ]
}

Rules:
- Return valid JSON only.
- Use English only for every title, subtitle, label, detail, and suggestion.
- Use only "india" or "world-ocean" as mapId.
- If the query is broad, mark multiple textbook-relevant places.
- If the query is specific, return only the precise answer region or location.
- Use short academic labels and accurate geography.
- Use percentage coordinates from 0 to 100.
- Use "left" or "right" for textAlign.
- Use marker type "region" for large areas such as oceans or deserts.
- Use marker type "path" for rivers or mountain chains when useful.
- If nothing reasonable matches, return {"mapId":"","title":"","subtitle":"","suggestedQueries":[],"markers":[]}.
- Prefer the fallback datasets when the topic clearly matches them.

Fallback datasets:
${JSON.stringify(buildFallbackSummary())}

Student query:
"${query}"`;
}

async function askAiForMapSearch(query) {
  const prompt = buildMapSearchPrompt(query);

  if (GEMINI_API_KEY) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(
        GEMINI_API_KEY
      )}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            topP: 0.8,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Gemini map search failed.");
    }

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || "").join("") || "";

    return tryParseJson(text);
  }

  const res = await askAiQuestion({
    question: prompt,
    classLevel: "general",
  });

  const rawText =
    res?.data?.answer ??
    res?.answer ??
    res?.data?.message ??
    "";

  return tryParseJson(String(rawText));
}

function computeViewport(markers = []) {
  if (!markers.length) {
    return { zoom: 1, focusX: 50, focusY: 50 };
  }

  const xs = markers.map((marker) => Number(marker.x));
  const ys = markers.map((marker) => Number(marker.y));
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = Math.max(12, maxX - minX + 14);
  const spanY = Math.max(12, maxY - minY + 16);
  const spread = Math.max(spanX, spanY);

  return {
    zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, 90 / spread)),
    focusX: Math.max(18, Math.min(82, (minX + maxX) / 2)),
    focusY: Math.max(18, Math.min(82, (minY + maxY) / 2)),
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function rectsOverlap(first, second, padding = 0.8) {
  return !(
    first.right + padding < second.left ||
    first.left - padding > second.right ||
    first.bottom + padding < second.top ||
    first.top - padding > second.bottom
  );
}

function estimateLabelSize(marker, mapId) {
  const charFactor = mapId === "india" ? 0.72 : 0.62;
  const width = clamp(marker.label.length * charFactor + 5.6, 10, mapId === "india" ? 20 : 18);
  const height = 5.8;

  return { width, height };
}

function buildLabelRect(x, y, width, height, position, gap) {
  if (position === "top") {
    return {
      left: x - width / 2,
      right: x + width / 2,
      top: y - gap - height,
      bottom: y - gap,
    };
  }

  if (position === "bottom") {
    return {
      left: x - width / 2,
      right: x + width / 2,
      top: y + gap,
      bottom: y + gap + height,
    };
  }

  if (position === "left") {
    return {
      left: x - gap - width,
      right: x - gap,
      top: y - height / 2,
      bottom: y + height / 2,
    };
  }

  return {
    left: x + gap,
    right: x + gap + width,
    top: y - height / 2,
    bottom: y + height / 2,
  };
}

function clampRectToBounds(rect, width, height) {
  const shiftX = rect.left < 2 ? 2 - rect.left : rect.right > 98 ? 98 - rect.right : 0;
  const shiftY = rect.top < 2 ? 2 - rect.top : rect.bottom > 98 ? 98 - rect.bottom : 0;

  return {
    left: rect.left + shiftX,
    right: rect.right + shiftX,
    top: rect.top + shiftY,
    bottom: rect.bottom + shiftY,
    width,
    height,
  };
}

function getLabelPreferences(marker) {
  const preferences = [];

  if (marker.x < 24) preferences.push("right");
  if (marker.x > 76) preferences.push("left");
  if (marker.y < 22) preferences.push("bottom");
  if (marker.y > 78) preferences.push("top");

  const horizontal = marker.x <= 50 ? "right" : "left";
  const vertical = marker.y <= 50 ? "bottom" : "top";

  preferences.push(horizontal, vertical, horizontal === "right" ? "left" : "right", vertical === "bottom" ? "top" : "bottom");

  return [...new Set(preferences)];
}

function resolveLabelPositionFromRect(marker, rect) {
  const centerX = (rect.left + rect.right) / 2;
  const centerY = (rect.top + rect.bottom) / 2;
  const deltaX = centerX - marker.x;
  const deltaY = centerY - marker.y;

  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    return deltaX >= 0 ? "right" : "left";
  }

  return deltaY >= 0 ? "bottom" : "top";
}

function buildFixedLabelRect(marker, mapId) {
  const size = estimateLabelSize(marker, mapId);
  const labelX = Number.isFinite(Number(marker.labelX))
    ? Number(marker.labelX)
    : marker.x <= 50
      ? marker.x + 8
      : marker.x - 8;
  const labelY = Number.isFinite(Number(marker.labelY))
    ? Number(marker.labelY)
    : marker.y;
  const width = clamp(Math.max(size.width, mapId === "india" ? 12.5 : 10), 10, mapId === "india" ? 22 : 18);
  const height = size.height;
  const alignedLeft =
    marker.textAlign === "right"
      ? labelX - width
      : labelX - width / 2;

  return clampRectToBounds(
    {
      left: alignedLeft,
      right: alignedLeft + width,
      top: labelY - height / 2,
      bottom: labelY + height / 2,
    },
    width,
    height
  );
}

function withRectOffset(rect, offsetX, offsetY, width, height) {
  return clampRectToBounds(
    {
      left: rect.left + offsetX,
      right: rect.right + offsetX,
      top: rect.top + offsetY,
      bottom: rect.bottom + offsetY,
    },
    width,
    height
  );
}

function layoutIndiaPointerMarkers(markers = []) {
  const placedRects = [];

  return [...markers]
    .sort((left, right) => left.y - right.y)
    .map((marker) => {
      const baseRect = buildFixedLabelRect(marker, "india");
      const width = baseRect.width || baseRect.right - baseRect.left;
      const height = baseRect.height || baseRect.bottom - baseRect.top;
      const sideDirection = marker.x <= 50 ? -1 : 1;
      const verticalDirection = marker.y <= 50 ? 1 : -1;
      const offsetCandidates = [
        [0, 0],
        [0, 3.2 * verticalDirection],
        [0, -3.2 * verticalDirection],
        [2.2 * sideDirection, 0],
        [2.2 * sideDirection, 3 * verticalDirection],
        [2.2 * sideDirection, -3 * verticalDirection],
        [4.2 * sideDirection, 0],
        [4.2 * sideDirection, 3 * verticalDirection],
        [4.2 * sideDirection, -3 * verticalDirection],
      ];

      const laidOutRect =
        offsetCandidates
          .map(([offsetX, offsetY]) => withRectOffset(baseRect, offsetX, offsetY, width, height))
          .find((candidateRect) => !placedRects.some((placed) => rectsOverlap(candidateRect, placed, 0.85))) ||
        withRectOffset(baseRect, 4.8 * sideDirection, 3.2 * verticalDirection, width, height);

      placedRects.push(laidOutRect);

      return {
        ...marker,
        labelBox: laidOutRect,
        labelPosition: resolveLabelPositionFromRect(marker, laidOutRect),
      };
    })
    .sort((left, right) => markers.findIndex((item) => item.id === left.id) - markers.findIndex((item) => item.id === right.id));
}

function layoutMarkers(markers = [], mapId) {
  if (mapId === "india" && markers.length > 1) {
    return layoutIndiaPointerMarkers(markers);
  }

  const placedRects = [];

  return markers.map((marker) => {
    const size = estimateLabelSize(marker, mapId);
    const gap = marker.type === "region" ? 3.8 : 2.8;
    const preferences = getLabelPreferences(marker);
    const candidates = preferences.map((position) => {
      const rect = clampRectToBounds(
        buildLabelRect(marker.x, marker.y, size.width, size.height, position, gap),
        size.width,
        size.height
      );

      const overlaps = placedRects.some((placed) => rectsOverlap(rect, placed));
      const offsetCost = Math.abs((rect.left + rect.right) / 2 - marker.x) + Math.abs((rect.top + rect.bottom) / 2 - marker.y);

      return {
        position,
        rect,
        overlaps,
        score: (overlaps ? 1000 : 0) + offsetCost,
      };
    });

    const bestCandidate = candidates.sort((left, right) => left.score - right.score)[0];
    placedRects.push(bestCandidate.rect);

    return {
      ...marker,
      labelPosition: bestCandidate.position,
      labelBox: bestCandidate.rect,
    };
  });
}

function layoutPracticeIndicators(questions = [], mapId, isMobile = false) {
  const placedRects = [];
  const bubbleSize = isMobile ? 11.5 : 9.2;
  const bubbleHalf = bubbleSize / 2;
  const offsetDistance = mapId === "india" ? (isMobile ? 11 : 9) : isMobile ? 9 : 7;

  return questions.map((question) => {
    const baseX = Number(question.x);
    const baseY = Number(question.y);
    const candidateOffsets = [
      [0, 0],
      [-offsetDistance, 0],
      [offsetDistance, 0],
      [0, -offsetDistance],
      [0, offsetDistance],
      [-offsetDistance * 0.75, -offsetDistance * 0.8],
      [offsetDistance * 0.75, -offsetDistance * 0.8],
      [-offsetDistance * 0.75, offsetDistance * 0.8],
      [offsetDistance * 0.75, offsetDistance * 0.8],
    ];

    const bubbleRect =
      candidateOffsets
        .map(([offsetX, offsetY]) =>
          clampRectToBounds(
            {
              left: baseX + offsetX - bubbleHalf,
              right: baseX + offsetX + bubbleHalf,
              top: baseY + offsetY - bubbleHalf,
              bottom: baseY + offsetY + bubbleHalf,
            },
            bubbleSize,
            bubbleSize
          )
        )
        .find((candidate) => !placedRects.some((placed) => rectsOverlap(candidate, placed, isMobile ? 1.1 : 0.9))) ||
      clampRectToBounds(
        {
          left: baseX - bubbleHalf,
          right: baseX + bubbleHalf,
          top: baseY - bubbleHalf,
          bottom: baseY + bubbleHalf,
        },
        bubbleSize,
        bubbleSize
      );

    placedRects.push(bubbleRect);

    return {
      ...question,
      markerX: baseX,
      markerY: baseY,
      bubbleX: (bubbleRect.left + bubbleRect.right) / 2,
      bubbleY: (bubbleRect.top + bubbleRect.bottom) / 2,
      bubbleSize,
    };
  });
}

function buildZoomTransform(scale, origin = { x: 50, y: 50 }) {
  const safeScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number(scale) || 1));
  const originX = clamp(Number(origin?.x) || 50, 0, 100);
  const originY = clamp(Number(origin?.y) || 50, 0, 100);
  const translateX = 50 - originX;
  const translateY = 50 - originY;

  return {
    scale: safeScale,
    originX,
    originY,
    transformOrigin: `${originX}% ${originY}%`,
    transform: `translate(${translateX}%, ${translateY}%) scale(${safeScale})`,
  };
}

function resolveLocalMapSearch(query) {
  const normalized = normalizeAnswer(query);
  if (!normalized) return EMPTY_MAP_RESULT;

  const queryTerms = extractMeaningfulTerms(normalized);
  const scoredTopics = FALLBACK_TOPICS.map((topic) => {
    const triggerMatches = topic.triggerTerms.filter((term) =>
      normalized.includes(normalizeAnswer(term))
    ).length;

    const markerMatches = topic.markers.filter((marker) => {
      const haystack = normalizeAnswer(`${marker.label} ${marker.detail || ""}`);
      return queryTerms.some((term) => haystack.includes(term));
    }).length;

    return {
      topic,
      score: triggerMatches * 4 + markerMatches,
    };
  })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  const best = scoredTopics[0]?.topic;
  if (best) {
    const filteredMarkers = queryTerms.length
      ? best.markers.filter((marker) => {
          const haystack = normalizeAnswer(markerSearchText(marker));
          return queryTerms.every((term) => haystack.includes(term)) || queryTerms.some((term) => haystack.includes(term));
        })
      : best.markers;

    const markers = (filteredMarkers.length ? filteredMarkers : best.markers).map((marker) => ({
      ...marker,
      type: marker.type || "point",
    }));

    return {
      mapId: best.mapId,
      title: best.title,
      subtitle: best.subtitle,
      suggestedQueries: SEARCH_SUGGESTIONS.filter((item) => item !== query).slice(0, 3),
      markers,
    };
  }

  const inferredMapId = inferMapIdFromQuery(normalized);
  const genericMatches = FALLBACK_TOPICS
    .filter((topic) => !inferredMapId || topic.mapId === inferredMapId)
    .flatMap((topic) =>
      topic.markers.map((marker) => ({
        topic,
        marker,
        score: queryTerms.reduce((sum, term) => {
          const haystack = normalizeAnswer(markerSearchText(marker));
          return sum + (haystack.includes(term) ? 1 : 0);
        }, 0),
      }))
    )
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score);

  if (!genericMatches.length) {
    return EMPTY_MAP_RESULT;
  }

  const primaryTopic = genericMatches[0].topic;
  const markers = genericMatches
    .filter((item) => item.topic.id === primaryTopic.id)
    .slice(0, 8)
    .map((item) => ({
      ...item.marker,
      type: item.marker.type || "point",
    }));

  return {
    mapId: primaryTopic.mapId,
    title: primaryTopic.title,
    subtitle: primaryTopic.subtitle,
    suggestedQueries: SEARCH_SUGGESTIONS.filter((item) => item !== query).slice(0, 3),
    markers,
  };
}

function sanitizeMapResult(result) {
  if (!result || !result.mapId || !Array.isArray(result.markers)) {
    return EMPTY_MAP_RESULT;
  }

  const markers = result.markers
    .filter(
      (marker) =>
        marker &&
        marker.label &&
        isEnglishOnlyText(marker.label) &&
        isEnglishOnlyText(marker.detail || "") &&
        Number.isFinite(Number(marker.x)) &&
        Number.isFinite(Number(marker.y)) &&
        Number.isFinite(Number(marker.labelX)) &&
        Number.isFinite(Number(marker.labelY))
    )
    .map((marker, index) => ({
      id: marker.id || `marker-${index}`,
      label: marker.label,
      detail: marker.detail || `${marker.label} marked on the map.`,
      x: Math.max(0, Math.min(100, Number(marker.x))),
      y: Math.max(0, Math.min(100, Number(marker.y))),
      labelX: Math.max(0, Math.min(100, Number(marker.labelX))),
      labelY: Math.max(0, Math.min(100, Number(marker.labelY))),
      textAlign: marker.textAlign === "right" ? "right" : "left",
      type: marker.type === "region" || marker.type === "path" ? marker.type : "point",
      width: Number.isFinite(Number(marker.width)) ? Math.max(4, Math.min(50, Number(marker.width))) : null,
      height: Number.isFinite(Number(marker.height)) ? Math.max(4, Math.min(40, Number(marker.height))) : null,
    }));

  if (!markers.length) return EMPTY_MAP_RESULT;

  return {
    mapId: result.mapId,
    title: isEnglishOnlyText(result.title) && result.title ? result.title : "Marked Places",
    subtitle:
      isEnglishOnlyText(result.subtitle) && result.subtitle
        ? result.subtitle
        : "AI-matched geography answer",
    suggestedQueries: Array.isArray(result.suggestedQueries)
      ? result.suggestedQueries.filter((item) => isEnglishOnlyText(item)).slice(0, 3)
      : [],
    markers,
  };
}

function buildFocusedPracticeQuestions(markers = []) {
  return markers
    .filter(
      (marker) =>
        marker &&
        marker.label &&
        Number.isFinite(Number(marker.x)) &&
        Number.isFinite(Number(marker.y))
    )
    .slice(0, 8)
    .map((marker, index) => ({
      id: `focused-${marker.id || index}`,
      label: marker.label,
      answer: marker.label,
      marks: 2,
      x: Number(marker.x),
      y: Number(marker.y),
      detail: marker.detail || `${marker.label} marked on the map.`,
    }));
}

function getCardState(activeMapId, mapId, practiceMapId = "") {
  if (practiceMapId) {
    if (practiceMapId === mapId) {
      return {
        flexBasis: "100%",
        maxWidth: "100%",
        opacity: 1,
        transform: "translateY(0) scale(1)",
        pointerEvents: "auto",
        visibility: "visible",
        minHeight: 0,
        overflow: "visible",
        alignSelf: "stretch",
      };
    }

    return {
      flexBasis: 0,
      maxWidth: 0,
      opacity: 0,
      transform: "translateY(10px) scale(0.96)",
      pointerEvents: "none",
      visibility: "hidden",
      minHeight: 0,
      overflow: "hidden",
      alignSelf: "stretch",
    };
  }

  if (!activeMapId) {
    return {
      flexBasis: { xs: "100%", md: "calc(50% - 16px)" },
      maxWidth: { xs: "100%", md: "calc(50% - 16px)" },
      opacity: 1,
      transform: "translateY(0) scale(1)",
      pointerEvents: "auto",
      visibility: "visible",
      minHeight: 0,
      overflow: "visible",
      alignSelf: "stretch",
    };
  }

  if (activeMapId === mapId) {
    return {
      flexBasis: "100%",
      maxWidth: "100%",
      opacity: 1,
      transform: "translateY(0) scale(1)",
      pointerEvents: "auto",
      visibility: "visible",
      minHeight: 0,
      overflow: "visible",
      alignSelf: "stretch",
    };
  }

  return {
    flexBasis: 0,
    maxWidth: 0,
    opacity: 0,
    transform: "translateY(10px) scale(0.96)",
    pointerEvents: "none",
    visibility: "hidden",
    minHeight: 0,
    overflow: "hidden",
    alignSelf: "stretch",
  };
}

function MapMarker({ marker, color, onSelect }) {
  const labelBox = marker.labelBox || {
    left: marker.labelX,
    right: marker.labelX + 12,
    top: marker.labelY,
    bottom: marker.labelY + 5,
  };
  const labelCenterX = (labelBox.left + labelBox.right) / 2;
  const labelCenterY = (labelBox.top + labelBox.bottom) / 2;
  const anchorX = marker.labelPosition === "left" ? labelBox.right : marker.labelPosition === "right" ? labelBox.left : labelCenterX;
  const anchorY = marker.labelPosition === "top" ? labelBox.bottom : marker.labelPosition === "bottom" ? labelBox.top : labelCenterY;
  const deltaX = anchorX - marker.x;
  const deltaY = anchorY - marker.y;
  const connectorLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const connectorAngle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
  const showConnector = connectorLength > 1.8;
  const showOverlayLabel = true;

  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="subtitle2" fontWeight={800}>
            {marker.label}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.92 }}>
            {marker.detail}
          </Typography>
        </Box>
      }
      arrow
    >
      <Box>
        {onSelect ? (
          <Box
            onClick={onSelect}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Show details for ${marker.label}`}
            sx={{
              position: "absolute",
              left: `${marker.x}%`,
              top: `${marker.y}%`,
              transform: "translate(-50%, -50%)",
              width: 40,
              height: 40,
              borderRadius: "50%",
              zIndex: 5,
              cursor: "pointer",
            }}
          />
        ) : null}
        {marker.type === "region" ? (
          <Box
            sx={{
              position: "absolute",
              left: `${marker.x}%`,
              top: `${marker.y}%`,
              width: `${marker.width || 12}%`,
              height: `${marker.height || 10}%`,
              transform: "translate(-50%, -50%)",
              borderRadius: "999px",
              border: `1px dashed ${alpha(color, 0.65)}`,
              bgcolor: alpha(color, 0.12),
              boxShadow: `0 0 0 12px ${alpha(color, 0.08)}`,
              animation: "mapGlow 2.6s ease-in-out infinite",
            }}
          />
        ) : null}

        {marker.type === "path" ? (
          <Box
            sx={{
              position: "absolute",
              left: `${marker.x}%`,
              top: `${marker.y}%`,
              width: 64,
              height: 14,
              transform: "translate(-50%, -50%) rotate(-14deg)",
              borderTop: `3px dotted ${color}`,
              opacity: 0.92,
              filter: `drop-shadow(0 0 8px ${alpha(color, 0.45)})`,
            }}
          />
        ) : null}

        <Box
          sx={{
            position: "absolute",
            left: `${marker.x}%`,
            top: `${marker.y}%`,
            transform: "translate(-50%, -95%) rotate(-45deg)",
            width: 18,
            height: 18,
            borderRadius: "50% 50% 50% 0",
            bgcolor: color,
            border: "2px solid white",
            boxShadow: `0 12px 24px ${alpha(color, 0.32)}`,
            zIndex: 3,
            "&::after": {
              content: '""',
              position: "absolute",
              inset: 4,
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.92)",
            },
          }}
        />
        <Box
          sx={{
            position: "absolute",
            left: `${marker.x}%`,
            top: `${marker.y}%`,
            transform: "translate(-50%, -50%)",
            width: 34,
            height: 34,
            borderRadius: "50%",
            bgcolor: alpha(color, 0.18),
            animation: "mapPulse 2.1s ease-out infinite",
            zIndex: 2,
          }}
        />
        {showConnector ? (
          <Box
            sx={{
              position: "absolute",
              left: `${marker.x}%`,
              top: `${marker.y}%`,
              width: `calc(${connectorLength}% - 8px)`,
              borderTop: `1.8px solid ${alpha(color, 0.75)}`,
              transform: `translateY(-50%) rotate(${connectorAngle}deg)`,
              transformOrigin: "left center",
              zIndex: 1,
            }}
          />
        ) : null}
        {showOverlayLabel ? (
          <Typography
            variant="caption"
            sx={{
              position: "absolute",
              left: `${labelBox.left}%`,
              top: `${labelBox.top}%`,
              width: `${labelBox.right - labelBox.left}%`,
              minHeight: `${labelBox.bottom - labelBox.top}%`,
              px: 0.9,
              py: 0.55,
              display: "flex",
              alignItems: "center",
              justifyContent: marker.labelPosition === "left" ? "flex-end" : marker.labelPosition === "right" ? "flex-start" : "center",
              borderRadius: 1.8,
              color: "#0b2545",
              bgcolor: "rgba(255,255,255,0.96)",
              backdropFilter: "blur(12px)",
              border: `1px solid ${alpha(color, 0.22)}`,
              boxShadow: "0 14px 28px rgba(15, 23, 42, 0.12)",
              fontWeight: 800,
              fontSize: { xs: "0.62rem", sm: "0.76rem" },
              lineHeight: 1,
              textAlign: "center",
              letterSpacing: "-0.01em",
              zIndex: 4,
              overflow: "hidden",
            }}
          >
            {marker.label}
          </Typography>
        ) : null}
      </Box>
    </Tooltip>
  );
}

function InteractiveMapCard({
  map,
  zoom,
  zoomOrigin,
  onZoomChange,
  onPinchStart,
  onPinchMove,
  onPinchEnd,
  onPractice,
  isPracticeOpen,
  isActiveSearch,
  isDimmed,
  searchResult,
  isMobile,
}) {
  const [selectedMarkerId, setSelectedMarkerId] = useState("");
  const markers = isActiveSearch && !isPracticeOpen ? searchResult.markers : [];
  const laidOutMarkers = useMemo(() => layoutMarkers(markers, map.id), [markers, map.id]);
  const zoomTransform = useMemo(
    () => buildZoomTransform(zoom, zoomOrigin),
    [zoom, zoomOrigin]
  );
  const cardAccent = map.accent;
  const shouldShowSearchSummary = false;
  const selectedMarker = useMemo(
    () => laidOutMarkers.find((marker) => marker.id === selectedMarkerId) || null,
    [laidOutMarkers, selectedMarkerId]
  );
  const zoomPercent = Math.round(zoomTransform.scale * 100);

  useEffect(() => {
    if (!laidOutMarkers.some((marker) => marker.id === selectedMarkerId)) {
      setSelectedMarkerId("");
    }
  }, [laidOutMarkers, selectedMarkerId]);

  return (
    <Box
      sx={{
        position: "relative",
        borderRadius: { xs: 0, sm: 6 },
        p: { xs: 0, sm: 2 },
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: isMobile
          ? "#ffffff"
          : `linear-gradient(180deg, ${alpha(cardAccent, 0.11)} 0%, rgba(255,255,255,0.86) 18%, rgba(255,255,255,0.96) 100%)`,
        border: `1px solid ${alpha(cardAccent, isActiveSearch ? 0.22 : 0.12)}`,
        boxShadow: isMobile
          ? "none"
          : isActiveSearch
            ? `0 26px 52px ${alpha(cardAccent, 0.18)}`
            : "0 20px 40px rgba(15, 23, 42, 0.07)",
        backdropFilter: isMobile ? "none" : "blur(18px)",
        transition: "transform 320ms ease, box-shadow 320ms ease, border-color 320ms ease",
        "&:hover": {
          transform: isMobile ? "none" : "translateY(-4px)",
          boxShadow: isMobile ? "none" : `0 30px 58px ${alpha(cardAccent, 0.18)}`,
        },
      }}
    >
      <Stack spacing={{ xs: 1.25, sm: 1.5 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
        >
          <Box sx={{ width: "100%" }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <Chip
                size="small"
                icon={map.id === "india" ? <MyLocation /> : <Public />}
                label={map.id === "india" ? "India Focus" : "World Focus"}
                sx={{
                  bgcolor: alpha(cardAccent, 0.12),
                  color: cardAccent,
                  fontWeight: 800,
                }}
              />
              {isActiveSearch ? (
                <Chip
                  size="small"
                  label="AI matched"
                  sx={{
                    bgcolor: alpha("#00a3ff", 0.1),
                    color: "#0065a8",
                    fontWeight: 800,
                  }}
                />
              ) : null}
            </Stack>
            <Typography variant="h6" fontWeight={900} color="#0b2a55">
              {map.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
              {map.caption}
            </Typography>
            {isMobile && isActiveSearch && searchResult.markers.length ? (
              <Typography variant="caption" sx={{ mt: 0.75, display: "block", color: "text.secondary", fontWeight: 700 }}>
                Tap a marker to see its name and details.
              </Typography>
            ) : null}
          </Box>

          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ width: { xs: "100%", sm: "auto" }, justifyContent: { xs: "space-between", sm: "flex-start" } }}>
            <IconButton
              size="small"
              onClick={() => onZoomChange(map.id, zoom - 0.15)}
              disabled={zoom <= MIN_ZOOM}
              aria-label={`Zoom out ${map.title}`}
              sx={{ bgcolor: "rgba(255,255,255,0.7)" }}
            >
              <Remove fontSize="small" />
            </IconButton>
            <Chip
              size="small"
              label={`${zoomPercent}%`}
              sx={{
                fontWeight: 800,
                bgcolor: "rgba(255,255,255,0.78)",
              }}
            />
            <IconButton
              size="small"
              onClick={() => onZoomChange(map.id, zoom + 0.15)}
              disabled={zoom >= MAX_ZOOM}
              aria-label={`Zoom in ${map.title}`}
              sx={{ bgcolor: "rgba(255,255,255,0.7)" }}
            >
              <Add fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => {
                onZoomChange(map.id, 1);
                onPinchEnd?.(map.id);
              }}
              aria-label={`Reset zoom ${map.title}`}
              sx={{ bgcolor: "rgba(255,255,255,0.7)" }}
            >
              <RestartAlt fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>

        <Box
          sx={{
            position: "relative",
            overflow: "hidden",
            borderRadius: { xs: 3, sm: 5 },
            bgcolor: isMobile ? "#f8fbff" : "#eef6ff",
            border: `1px solid ${alpha(cardAccent, 0.15)}`,
            height: { xs: map.id === "india" ? 360 : 250, sm: 430, md: 520 },
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at top right, rgba(255,255,255,0.95), rgba(255,255,255,0) 35%)",
              zIndex: 0,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              transform: zoomTransform.transform,
              transformOrigin: zoomTransform.transformOrigin,
              transition: "transform 520ms cubic-bezier(0.22, 1, 0.36, 1)",
              touchAction: "none",
            }}
            onTouchStart={(event) => onPinchStart?.(map.id, event)}
            onTouchMove={(event) => onPinchMove?.(map.id, event)}
            onTouchEnd={() => onPinchEnd?.(map.id)}
          >
            <Box
              component="img"
              src={resolveAssetUrl(map.imageUrl)}
              alt={map.title}
              sx={{
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "contain",
                filter: isPracticeOpen
                  ? "blur(6px) saturate(0.75)"
                  : isDimmed
                    ? "grayscale(0.2) saturate(0.9)"
                    : "none",
                opacity: isPracticeOpen ? 0.34 : isDimmed ? 0.6 : 1,
                transition: "filter 260ms ease, opacity 260ms ease",
              }}
            />

            {laidOutMarkers.map((marker) => (
              <MapMarker
                key={marker.id}
                marker={marker}
                color={cardAccent}
                onSelect={() => setSelectedMarkerId(marker.id)}
              />
            ))}

            {selectedMarker ? (
              <Box
                sx={{
                  position: "absolute",
                  left: { xs: 10, sm: 16 },
                  right: { xs: 10, sm: 16 },
                  bottom: { xs: 10, sm: 16 },
                  zIndex: 6,
                  p: { xs: 1.1, sm: 1.35 },
                  borderRadius: 3,
                  bgcolor: "rgba(255,255,255,0.94)",
                  backdropFilter: "blur(14px)",
                  border: `1px solid ${alpha(cardAccent, 0.22)}`,
                  boxShadow: "0 16px 32px rgba(15, 23, 42, 0.12)",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={900} color="#0b2a55">
                      {selectedMarker.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.35 }}>
                      {selectedMarker.detail}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => setSelectedMarkerId("")}
                    aria-label={`Close details for ${selectedMarker.label}`}
                    sx={{ mt: -0.5, mr: -0.5 }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </Stack>
              </Box>
            ) : null}
          </Box>

          {shouldShowSearchSummary ? (
            <Box
              sx={{
                position: "absolute",
                left: 16,
                right: 16,
                bottom: 16,
                p: 1.4,
                borderRadius: 4,
                bgcolor: "rgba(255,255,255,0.82)",
                backdropFilter: "blur(12px)",
                border: `1px solid ${alpha(cardAccent, 0.18)}`,
                boxShadow: "0 20px 40px rgba(15, 23, 42, 0.12)",
              }}
            >
              <Typography variant="subtitle1" fontWeight={900} color="#0b2a55">
                {searchResult.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchResult.subtitle}
              </Typography>
            </Box>
          ) : null}
        </Box>

        <Button
          variant="contained"
          startIcon={<TaskAlt />}
          onClick={() => onPractice(map.id)}
          fullWidth
          sx={{
            mt: "auto",
            fontWeight: 900,
            borderRadius: 999,
            py: 1.25,
            textTransform: "none",
            background: `linear-gradient(135deg, ${cardAccent} 0%, #3bb2ff 100%)`,
            boxShadow: `0 18px 34px ${alpha(cardAccent, 0.24)}`,
          }}
        >
          Practice On This Map
        </Button>
      </Stack>
    </Box>
  );
}

export default function MapsPanel() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const practiceSectionRef = useRef(null);
  const searchCacheRef = useRef(new Map());
  const pinchStateRef = useRef({});
  const [zooms, setZooms] = useState(() =>
    mapPhotos.reduce((items, map) => ({ ...items, [map.id]: 1 }), {})
  );
  const [zoomOrigins, setZoomOrigins] = useState(() =>
    mapPhotos.reduce((items, map) => ({ ...items, [map.id]: { x: 50, y: 50 } }), {})
  );
  const [searchText, setSearchText] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [practiceMapId, setPracticeMapId] = useState("");
  const [practiceMode, setPracticeMode] = useState("default");
  const [practiceMeta, setPracticeMeta] = useState(null);
  const [practiceRound, setPracticeRound] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [mapSearchResult, setMapSearchResult] = useState(EMPTY_MAP_RESULT);
  const [isMapSearching, setIsMapSearching] = useState(false);

  const practiceMap = useMemo(
    () => mapPhotos.find((map) => map.id === practiceMapId),
    [practiceMapId]
  );
  const focusedPracticeQuestions = useMemo(
    () => (practiceMode === "focused" ? buildFocusedPracticeQuestions(practiceMeta?.markers || []) : []),
    [practiceMode, practiceMeta]
  );
  const practiceQuestions = useMemo(
    () =>
      !practiceMap
        ? []
        : practiceMode === "focused"
          ? focusedPracticeQuestions
          : selectPracticeQuestions(practiceMap.questions, practiceRound),
    [focusedPracticeQuestions, practiceMap, practiceMode, practiceRound]
  );
  const laidOutPracticeQuestions = useMemo(
    () => layoutPracticeIndicators(practiceQuestions, practiceMap?.id || "", isMobile),
    [isMobile, practiceMap?.id, practiceQuestions]
  );
  const practiceViewport = useMemo(
    () =>
      practiceMode === "focused" && focusedPracticeQuestions.length
        ? computeViewport(focusedPracticeQuestions)
        : DEFAULT_VIEWPORT,
    [focusedPracticeQuestions, practiceMode]
  );
  const practiceResetZoom = useMemo(
    () =>
      practiceMode === "focused"
        ? Math.max(1, Math.min(MAX_ZOOM, Number(practiceViewport.zoom) || 1))
        : 1,
    [practiceMode, practiceViewport.zoom]
  );
  const activeSearchMapId = mapSearchResult.mapId || "";
  const activeSearchMap = activeSearchMapId ? MAP_BY_ID[activeSearchMapId] : null;
  const hasSubmittedSearch = Boolean(submittedSearch.trim());

  const clearSearch = () => {
    setSearchText("");
    setSubmittedSearch("");
    setMapSearchResult(EMPTY_MAP_RESULT);
    setIsMapSearching(false);
  };

  useEffect(() => {
    let ignore = false;
    const trimmedSearch = submittedSearch.trim().toLowerCase();

    if (!trimmedSearch) {
      setMapSearchResult(EMPTY_MAP_RESULT);
      setIsMapSearching(false);
      return undefined;
    }

    const immediateResult = resolveLocalMapSearch(trimmedSearch);
    if (immediateResult.markers.length) {
      setMapSearchResult(immediateResult);
    }

    const cachedResult = searchCacheRef.current.get(trimmedSearch);
    if (cachedResult) {
      setMapSearchResult(cachedResult);
      setIsMapSearching(false);
      return undefined;
    }

    setIsMapSearching(!immediateResult.markers.length);

    const timer = setTimeout(async () => {
      try {
        const aiResult = await askAiForMapSearch(trimmedSearch);
        if (ignore) return;

        const sanitized = sanitizeMapResult(aiResult);
        const finalResult = sanitized.markers.length ? sanitized : immediateResult;
        searchCacheRef.current.set(trimmedSearch, finalResult);
        setMapSearchResult(finalResult);
      } catch {
        if (!ignore) {
          setMapSearchResult(immediateResult);
        }
      } finally {
        if (!ignore) {
          setIsMapSearching(false);
        }
      }
    }, immediateResult.markers.length ? 0 : 120);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [submittedSearch]);

  useEffect(() => {
    if (!practiceMap) return;

    const timer = setTimeout(() => {
      practiceSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 120);

    return () => clearTimeout(timer);
  }, [practiceMap]);

  const changeZoom = (mapId, nextZoom) => {
    setZooms((current) => ({
      ...current,
      [mapId]: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom)),
    }));
  };

  const setZoomOrigin = (mapId, x, y) => {
    setZoomOrigins((current) => ({
      ...current,
      [mapId]: {
        x: clamp(x, 18, 82),
        y: clamp(y, 18, 82),
      },
    }));
  };

  const resetMapView = (mapId, focusX = 50, focusY = 50, zoomLevel = 1) => {
    changeZoom(mapId, zoomLevel);
    setZoomOrigin(mapId, focusX, focusY);
  };

  const handlePinchStart = (mapId, event) => {
    if (event.touches.length !== 2) return;
    const touchA = event.touches[0];
    const touchB = event.touches[1];
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = ((touchA.clientX + touchB.clientX) / 2 - rect.left) / rect.width * 100;
    const centerY = ((touchA.clientY + touchB.clientY) / 2 - rect.top) / rect.height * 100;
    const distance = Math.hypot(touchA.clientX - touchB.clientX, touchA.clientY - touchB.clientY);

    pinchStateRef.current[mapId] = {
      distance,
      zoom: zooms[mapId] || 1,
    };
    setZoomOrigin(mapId, centerX, centerY);
  };

  const handlePinchMove = (mapId, event) => {
    if (event.touches.length !== 2) return;
    const pinchState = pinchStateRef.current[mapId];
    if (!pinchState?.distance) return;

    event.preventDefault();
    const touchA = event.touches[0];
    const touchB = event.touches[1];
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = ((touchA.clientX + touchB.clientX) / 2 - rect.left) / rect.width * 100;
    const centerY = ((touchA.clientY + touchB.clientY) / 2 - rect.top) / rect.height * 100;
    const distance = Math.hypot(touchA.clientX - touchB.clientX, touchA.clientY - touchB.clientY);
    const nextZoom = pinchState.zoom * (distance / pinchState.distance);

    setZoomOrigin(mapId, centerX, centerY);
    changeZoom(mapId, nextZoom);
  };

  const handlePinchEnd = (mapId) => {
    pinchStateRef.current[mapId] = null;
  };

  const startPractice = (mapId) => {
    const shouldUseFocusedMode =
      activeSearchMapId === mapId &&
      Array.isArray(mapSearchResult.markers) &&
      mapSearchResult.markers.length > 0;
    const focusedViewport = shouldUseFocusedMode
      ? computeViewport(buildFocusedPracticeQuestions(mapSearchResult.markers))
      : DEFAULT_VIEWPORT;

    setPracticeMapId(mapId);
    setPracticeMode(shouldUseFocusedMode ? "focused" : "default");
    setPracticeMeta(
      shouldUseFocusedMode
        ? {
            title: mapSearchResult.title || MAP_BY_ID[mapId]?.title || "Focused Practice",
            subtitle:
              mapSearchResult.subtitle || "Practice only the searched geography topic on this map.",
            markers: mapSearchResult.markers,
            searchQuery: submittedSearch.trim(),
          }
        : null
    );
    setZoomOrigin(mapId, focusedViewport.focusX || 50, focusedViewport.focusY || 50);
    changeZoom(
      mapId,
      shouldUseFocusedMode
        ? Math.max(1, Math.min(MAX_ZOOM, Number(focusedViewport.zoom) || 1))
        : 1
    );
    setPracticeRound((current) => current + 1);
    setAnswers({});
    setResult(null);
  };

  const refreshPractice = () => {
    setPracticeRound((current) => current + 1);
    setAnswers({});
    setResult(null);
  };

  const cancelPractice = () => {
    setPracticeMapId("");
    setPracticeMode("default");
    setPracticeMeta(null);
    setAnswers({});
    setResult(null);
  };

  const updateAnswer = (questionId, value) => {
    setAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));
  };

  const submitPractice = () => {
    if (!practiceMap) return;

    const checked = practiceQuestions.map((question) => {
      const studentAnswer = normalizeAnswer(answers[question.id]);
      const correctAnswer = normalizeAnswer(question.answer);
      const isCorrect =
        studentAnswer &&
        (studentAnswer === correctAnswer ||
          studentAnswer.includes(correctAnswer) ||
          correctAnswer.includes(studentAnswer));

      return {
        ...question,
        isCorrect,
        earnedMarks: isCorrect ? question.marks : 0,
      };
    });

    setResult({
      checked,
      score: checked.reduce((sum, question) => sum + question.earnedMarks, 0),
      total: checked.reduce((sum, question) => sum + question.marks, 0),
    });
  };

  const practiceScale = zooms[practiceMapId] || practiceResetZoom;
  const practiceOrigin = zoomOrigins[practiceMapId] || {
    x: practiceViewport.focusX || 50,
    y: practiceViewport.focusY || 50,
  };
  const practiceZoomTransform = buildZoomTransform(practiceScale, practiceOrigin);

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: { xs: 0, sm: 6 },
        borderColor: { xs: "transparent", sm: "rgba(21, 101, 192, 0.14)" },
        background: {
          xs: "#fcfdff",
          sm: "linear-gradient(180deg, rgba(245,249,255,1) 0%, rgba(255,255,255,0.98) 22%, rgba(246,250,255,1) 100%)",
        },
        boxShadow: { xs: "none", sm: "0 24px 60px rgba(15, 23, 42, 0.08)" },
        overflow: "hidden",
        "@keyframes mapPulse": {
          "0%": { transform: "translate(-50%, -50%) scale(0.8)", opacity: 0.75 },
          "70%": { transform: "translate(-50%, -50%) scale(1.55)", opacity: 0 },
          "100%": { transform: "translate(-50%, -50%) scale(1.55)", opacity: 0 },
        },
        "@keyframes mapGlow": {
          "0%, 100%": { transform: "translate(-50%, -50%) scale(1)", opacity: 0.92 },
          "50%": { transform: "translate(-50%, -50%) scale(1.06)", opacity: 1 },
        },
      }}
    >
      <CardContent sx={{ p: { xs: 0, sm: 2.5, md: 3 } }}>
        <Stack spacing={{ xs: 2, sm: 3 }}>
          <Box
            sx={{
              borderRadius: { xs: 0, sm: 5 },
              p: { xs: 0, sm: 2.5, md: 3 },
              background: {
                xs: "transparent",
                sm: "linear-gradient(135deg, rgba(17,111,199,0.10) 0%, rgba(255,255,255,0.95) 38%, rgba(3,169,244,0.08) 100%)",
              },
              border: { xs: "none", sm: "1px solid rgba(17,111,199,0.12)" },
              boxShadow: { xs: "none", sm: "0 18px 36px rgba(15, 23, 42, 0.05)" },
            }}
          >
            <Stack spacing={{ xs: 1.5, sm: 2.2 }}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
              >
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Box
                      sx={{
                        width: { xs: 36, sm: 42 },
                        height: { xs: 36, sm: 42 },
                        borderRadius: { xs: 2, sm: 3 },
                        display: "grid",
                        placeItems: "center",
                        background: "linear-gradient(135deg, #116fc7 0%, #33a7ff 100%)",
                        color: "white",
                        boxShadow: { xs: "none", sm: "0 14px 28px rgba(17, 111, 199, 0.24)" },
                      }}
                    >
                      <Explore />
                    </Box>
                    <Box>
                      <Typography variant="h5" fontWeight={900} color="#0b2a55" sx={{ fontSize: { xs: "1.1rem", sm: "1.5rem" } }}>
                        Maps Practice
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Stack>

              <TextField
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    setSubmittedSearch(searchText.trim());
                  }
                }}
                fullWidth
                placeholder={isMobile ? "Ask any map question" : "Ask anything: Show major ports in India, Rivers, Pacific Ocean, Deserts, Countries in Asia..."}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      {isMapSearching ? <CircularProgress size={18} /> : null}
                      {searchText || hasSubmittedSearch ? (
                        <Button
                          onClick={clearSearch}
                          startIcon={<Close />}
                        sx={{
                          ml: 1,
                          minWidth: 0,
                          borderRadius: 999,
                          px: { xs: 1.2, sm: 1.5 },
                          fontWeight: 800,
                          textTransform: "none",
                          color: "#4b5563",
                            bgcolor: "rgba(255,255,255,0.82)",
                            "&:hover": {
                              bgcolor: "rgba(255,255,255,0.96)",
                            },
                          }}
                        >
                          Clear
                        </Button>
                      ) : null}
                      <Button
                        variant="contained"
                        onClick={() => setSubmittedSearch(searchText.trim())}
                        sx={{
                          ml: 1,
                          borderRadius: 999,
                          px: { xs: 1.6, sm: 2 },
                          fontWeight: 800,
                          textTransform: "none",
                          background: "linear-gradient(135deg, #116fc7 0%, #33a7ff 100%)",
                        }}
                      >
                        Search
                      </Button>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: { xs: 3, sm: 999 },
                    bgcolor: "rgba(255,255,255,0.94)",
                    boxShadow: { xs: "none", sm: "0 16px 34px rgba(15, 23, 42, 0.08)" },
                    minHeight: { xs: 54, sm: "auto" },
                    pr: 0.6,
                  },
                }}
              />

              {hasSubmittedSearch ? (
                isMapSearching ? (
                  <Alert severity="info" sx={{ borderRadius: 3 }}>
                    Reading the geography question, selecting the correct map, and placing aligned markers...
                  </Alert>
                ) : mapSearchResult.markers.length ? (
                  <Alert
                    severity="success"
                    sx={{
                      borderRadius: 3,
                      alignItems: "center",
                      "& .MuiAlert-message": {
                        width: "100%",
                      },
                    }}
                  >
                    <Box sx={{ width: "100%" }}>
                      <Typography variant="subtitle2" fontWeight={800} sx={{ textTransform: "none" }}>
                        Search result ready
                      </Typography>
                      <Typography variant="body2" sx={{ textTransform: "none" }}>
                        {activeSearchMap?.title} is active for "{submittedSearch}" with {mapSearchResult.markers.length} highlighted answer
                        {mapSearchResult.markers.length > 1 ? "s" : ""}.
                      </Typography>
                    </Box>
                  </Alert>
                ) : (
                  <Alert
                    severity="info"
                    sx={{
                      borderRadius: 3,
                      alignItems: "center",
                      "& .MuiAlert-message": {
                        width: "100%",
                      },
                    }}
                  >
                    <Box sx={{ width: "100%" }}>
                      <Typography variant="subtitle2" fontWeight={800} sx={{ textTransform: "none" }}>
                        No map result found
                      </Typography>
                      <Typography variant="body2" sx={{ textTransform: "none" }}>
                        No map answer was found for "{submittedSearch}". Try a topic like rivers, ports, deserts, or countries in Asia.
                      </Typography>
                    </Box>
                  </Alert>
                )
              ) : null}

            </Stack>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: { xs: 1.5, sm: 3 },
              justifyContent: "center",
              alignItems: "stretch",
            }}
          >
            {mapPhotos.map((map) => {
              const cardState = getCardState(activeSearchMapId, map.id, practiceMapId);
              const isPracticeOpen = practiceMapId === map.id;

              return (
                <Box
                  key={map.id}
                  sx={{
                    width: "100%",
                    transition:
                      "flex-basis 360ms cubic-bezier(0.22, 1, 0.36, 1), max-width 360ms cubic-bezier(0.22, 1, 0.36, 1), opacity 260ms ease, transform 260ms ease, min-height 260ms ease",
                    ...cardState,
                  }}
                >
                  <InteractiveMapCard
                    map={map}
                    zoom={zooms[map.id] || 1}
                    zoomOrigin={zoomOrigins[map.id]}
                    onZoomChange={changeZoom}
                    onPinchStart={handlePinchStart}
                    onPinchMove={handlePinchMove}
                    onPinchEnd={handlePinchEnd}
                    onPractice={startPractice}
                    isPracticeOpen={isPracticeOpen}
                    isActiveSearch={activeSearchMapId === map.id}
                    isDimmed={Boolean(activeSearchMapId) && activeSearchMapId !== map.id}
                    searchResult={mapSearchResult}
                    isMobile={isMobile}
                  />
                </Box>
              );
            })}
          </Box>

          {practiceMap ? (
            <Box
              ref={practiceSectionRef}
              sx={{
                borderRadius: { xs: 3, sm: 5 },
                p: { xs: 2, sm: 2.5 },
                bgcolor: "rgba(255,255,255,0.92)",
                border: `1px solid ${alpha(practiceMap.accent, 0.15)}`,
                boxShadow: { xs: "none", sm: "0 20px 42px rgba(15, 23, 42, 0.08)" },
              }}
            >
              <Stack spacing={2}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={1.5}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", md: "center" }}
                >
                  <Box>
                    <Typography variant="h6" fontWeight={900} color="#0b2a55">
                      {practiceMode === "focused" && practiceMeta?.title
                        ? `${practiceMeta.title} Practice`
                        : `${practiceMap.title} Practice`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {practiceMode === "focused"
                        ? practiceMeta?.subtitle || "Practice the searched geography topic on the focused map."
                        : "Fill the numbered boxes directly on the blank map and check your score instantly."}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                    <IconButton
                      size="small"
                      onClick={() => changeZoom(practiceMap.id, (zooms[practiceMap.id] || 1) - 0.15)}
                      disabled={(zooms[practiceMap.id] || 1) <= MIN_ZOOM}
                      aria-label={`Zoom out ${practiceMap.title} practice`}
                    >
                      <Remove fontSize="small" />
                    </IconButton>
                    <Chip
                      size="small"
                      label={`${Math.round(practiceZoomTransform.scale * 100)}%`}
                      sx={{ fontWeight: 800 }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => changeZoom(practiceMap.id, (zooms[practiceMap.id] || 1) + 0.15)}
                      disabled={(zooms[practiceMap.id] || 1) >= MAX_ZOOM}
                      aria-label={`Zoom in ${practiceMap.title} practice`}
                    >
                      <Add fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() =>
                        resetMapView(
                          practiceMap.id,
                          practiceViewport.focusX || 50,
                          practiceViewport.focusY || 50,
                          practiceResetZoom
                        )
                      }
                      aria-label={`Reset zoom ${practiceMap.title} practice`}
                    >
                      <RestartAlt fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={refreshPractice}
                      aria-label={`Refresh ${practiceMap.title} practice`}
                    >
                      <Refresh fontSize="small" />
                    </IconButton>
                    <Chip
                      color={result ? "primary" : "default"}
                      label={result ? `Marks: ${result.score} / ${result.total}` : "Quiz mode"}
                      sx={{ fontWeight: 800 }}
                    />
                  </Stack>
                </Stack>

                <Divider />

                <Box
                  sx={{
                    overflow: "auto",
                    borderRadius: 4,
                    p: 1,
                    bgcolor: "#f7fbff",
                    border: "1px solid rgba(17,111,199,0.08)",
                  }}
                >
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: practiceMap.practiceAspectRatio,
                      bgcolor: "white",
                      borderRadius: 3,
                      overflow: "hidden",
                      touchAction: "none",
                    }}
                    onTouchStart={(event) => handlePinchStart(practiceMap.id, event)}
                    onTouchMove={(event) => handlePinchMove(practiceMap.id, event)}
                    onTouchEnd={() => handlePinchEnd(practiceMap.id)}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        transform: practiceZoomTransform.transform,
                        transformOrigin: practiceZoomTransform.transformOrigin,
                        transition: "transform 320ms ease",
                      }}
                    >
                      <Box
                        component="img"
                        src={resolveAssetUrl(practiceMap.practiceImageUrl || practiceMap.imageUrl)}
                        alt={`${practiceMap.title} practice`}
                        sx={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          backgroundColor: "white",
                        }}
                      />

                      {laidOutPracticeQuestions.map((question, index) => {
                        const checked = result?.checked.find((item) => item.id === question.id);
                        const connectorLength = Math.hypot(
                          Number(question.markerX) - Number(question.bubbleX),
                          Number(question.markerY) - Number(question.bubbleY)
                        );
                        const connectorAngle =
                          (Math.atan2(
                            Number(question.markerY) - Number(question.bubbleY),
                            Number(question.markerX) - Number(question.bubbleX)
                          ) *
                            180) /
                          Math.PI;
                        return (
                          <Box key={`${question.id}-marker`}>
                            {connectorLength > 1.2 ? (
                              <Box
                                sx={{
                                  position: "absolute",
                                  left: `${question.bubbleX}%`,
                                  top: `${question.bubbleY}%`,
                                  width: `${connectorLength}%`,
                                  borderTop: `1.8px solid ${alpha(practiceMap.accent, 0.58)}`,
                                  transform: `translateY(-50%) rotate(${connectorAngle}deg)`,
                                  transformOrigin: "left center",
                                  zIndex: 1,
                                }}
                              />
                            ) : null}
                            <Box
                              sx={{
                                position: "absolute",
                                left: `${question.markerX}%`,
                                top: `${question.markerY}%`,
                                transform: "translate(-50%, -50%)",
                                width: { xs: 10, sm: 12 },
                                height: { xs: 10, sm: 12 },
                                borderRadius: "50%",
                                bgcolor: practiceMap.accent,
                                border: "2px solid white",
                                boxShadow: `0 8px 18px ${alpha(practiceMap.accent, 0.28)}`,
                                zIndex: 2,
                              }}
                            />
                            <Box
                              sx={{
                                position: "absolute",
                                left: `${question.bubbleX}%`,
                                top: `${question.bubbleY}%`,
                                transform: "translate(-50%, -50%)",
                                width: { xs: 34, sm: 38 },
                                height: { xs: 34, sm: 38 },
                                borderRadius: "50%",
                                display: "grid",
                                placeItems: "center",
                                bgcolor: checked
                                  ? checked.isCorrect
                                    ? "success.main"
                                    : "warning.main"
                                  : "rgba(255,255,255,0.98)",
                                color: checked ? "#fff" : "#0b2a55",
                                border: `2px solid ${alpha(practiceMap.accent, 0.42)}`,
                                boxShadow: "0 10px 18px rgba(15, 23, 42, 0.14)",
                                fontWeight: 900,
                                fontSize: { xs: "0.84rem", sm: "0.95rem" },
                                zIndex: 3,
                              }}
                            >
                              {index + 1}
                            </Box>
                          </Box>
                        );
                      })}

                      {!isMobile ? (
                        laidOutPracticeQuestions.map((question, index) => {
                          const checked = result?.checked.find((item) => item.id === question.id);
                          const borderColor = checked
                            ? checked.isCorrect
                              ? "success.main"
                              : "warning.main"
                            : "primary.main";

                          return (
                            <Box
                              key={question.id}
                              sx={{
                                position: "absolute",
                                left: `${question.bubbleX}%`,
                                top: `${Math.min(94, question.bubbleY + 8)}%`,
                                transform: "translate(-50%, 0)",
                                width: { xs: 118, sm: 152 },
                                zIndex: 4,
                              }}
                            >
                              <TextField
                                value={answers[question.id] || ""}
                                onChange={(event) => updateAnswer(question.id, event.target.value)}
                                fullWidth
                                size="small"
                                placeholder={`${index + 1}`}
                                disabled={Boolean(result)}
                                sx={{
                                  bgcolor: "rgba(255,255,255,0.96)",
                                  borderRadius: 2,
                                  boxShadow: "0 10px 18px rgba(15, 23, 42, 0.10)",
                                  "& .MuiOutlinedInput-root": {
                                    fontWeight: 800,
                                    fontSize: { xs: 12, sm: 14 },
                                    color: checked?.isCorrect ? "success.main" : "text.primary",
                                    "& fieldset": {
                                      borderColor,
                                      borderWidth: checked ? 2 : 1,
                                    },
                                    "&:hover fieldset": {
                                      borderColor,
                                    },
                                    "&.Mui-focused fieldset": {
                                      borderColor,
                                    },
                                  },
                                }}
                              />
                              {checked ? (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    display: "inline-block",
                                    mt: 0.4,
                                    px: 0.85,
                                    py: 0.25,
                                    borderRadius: 999,
                                    bgcolor: "rgba(255,255,255,0.95)",
                                    fontWeight: 800,
                                  }}
                                  color={checked.isCorrect ? "success.main" : "warning.main"}
                                >
                                  {checked.isCorrect ? `Correct +${question.marks}` : `Answer: ${question.answer}`}
                                </Typography>
                              ) : null}
                            </Box>
                          );
                        })
                      ) : null}
                    </Box>
                  </Box>
                </Box>

                {isMobile ? (
                  <Stack spacing={1.1}>
                    <Typography variant="subtitle2" fontWeight={900} color="#0b2a55">
                      Answer the numbered places below
                    </Typography>
                    {laidOutPracticeQuestions.map((question, index) => {
                      const checked = result?.checked.find((item) => item.id === question.id);
                      const borderColor = checked
                        ? checked.isCorrect
                          ? "success.main"
                          : "warning.main"
                        : "primary.main";

                      return (
                        <Box
                          key={`${question.id}-mobile-input`}
                          sx={{
                            borderRadius: 3,
                            p: 1,
                            bgcolor: "rgba(247,251,255,0.92)",
                            border: `1px solid ${alpha(practiceMap.accent, 0.12)}`,
                          }}
                        >
                          <Stack direction="row" spacing={1} alignItems="flex-start">
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                mt: 0.75,
                                borderRadius: "50%",
                                display: "grid",
                                placeItems: "center",
                                bgcolor: alpha(practiceMap.accent, 0.12),
                                color: "#0b2a55",
                                fontWeight: 900,
                                flexShrink: 0,
                              }}
                            >
                              {index + 1}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <TextField
                                value={answers[question.id] || ""}
                                onChange={(event) => updateAnswer(question.id, event.target.value)}
                                fullWidth
                                size="small"
                                placeholder={`Type answer for ${index + 1}`}
                                disabled={Boolean(result)}
                                sx={{
                                  bgcolor: "rgba(255,255,255,0.98)",
                                  borderRadius: 2.5,
                                  "& .MuiOutlinedInput-root": {
                                    fontWeight: 800,
                                    fontSize: 14,
                                    color: checked?.isCorrect ? "success.main" : "text.primary",
                                    "& fieldset": {
                                      borderColor,
                                      borderWidth: checked ? 2 : 1,
                                    },
                                    "&:hover fieldset": {
                                      borderColor,
                                    },
                                    "&.Mui-focused fieldset": {
                                      borderColor,
                                    },
                                  },
                                }}
                              />
                              {checked ? (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    display: "inline-block",
                                    mt: 0.5,
                                    px: 0.9,
                                    py: 0.25,
                                    borderRadius: 999,
                                    bgcolor: "rgba(255,255,255,0.95)",
                                    fontWeight: 800,
                                  }}
                                  color={checked.isCorrect ? "success.main" : "warning.main"}
                                >
                                  {checked.isCorrect ? `Correct +${question.marks}` : `Answer: ${question.answer}`}
                                </Typography>
                              ) : null}
                            </Box>
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                ) : null}

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                  <Button
                    variant="outlined"
                    onClick={cancelPractice}
                    fullWidth
                    sx={{
                      borderRadius: 999,
                      py: 1.2,
                      fontWeight: 900,
                      textTransform: "none",
                      borderColor: alpha(practiceMap.accent, 0.3),
                      color: "#0b2a55",
                    }}
                  >
                    Cancel Practice
                  </Button>
                  <Button
                    variant="contained"
                    onClick={submitPractice}
                    disabled={Boolean(result)}
                    fullWidth
                    sx={{
                      borderRadius: 999,
                      py: 1.2,
                      fontWeight: 900,
                      textTransform: "none",
                      background: `linear-gradient(135deg, ${practiceMap.accent} 0%, #33a7ff 100%)`,
                    }}
                  >
                    {result ? `Result: ${result.score} / ${result.total} marks` : "Submit Practice"}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          ) : null}

          {mapSearchResult.suggestedQueries?.length ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                flexWrap="wrap"
                useFlexGap
                sx={{
                  px: 2,
                  py: 1.4,
                  borderRadius: 999,
                  bgcolor: "rgba(243,248,255,0.92)",
                  border: "1px solid rgba(17,111,199,0.10)",
                }}
              >
                {mapSearchResult.suggestedQueries.map((item) => (
                  <Chip
                    key={item}
                    label={item}
                    onClick={() => {
                      setSearchText(item);
                      setSubmittedSearch(item);
                    }}
                    sx={{ fontWeight: 700 }}
                  />
                ))}
              </Stack>
            </Box>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
