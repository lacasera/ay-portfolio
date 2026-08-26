export const INDEX_NAME = "products";
export const INGEST_PIPELINE = "nlp-ingest-pipeline";
export const SEARCH_PIPELINE = "nlp-search-pipeline";
export const MODEL_GROUP = "fashion_search_models";
export const EMBEDDING_DIMENSION = 384;

export const EMBEDDING_MODEL = {
  name: "huggingface/sentence-transformers/all-MiniLM-L6-v2",
  version: "1.0.1",
  model_format: "TORCH_SCRIPT",
} as const;

export const CLUSTER_SETTINGS = {
  persistent: {
    "plugins.ml_commons.only_run_on_ml_node": false,
    "plugins.ml_commons.model_access_control_enabled": false,
    "plugins.ml_commons.native_memory_threshold": 99,
  },
};

export function ingestPipelineBody(modelId: string) {
  return {
    description: "auto-embed product text",
    processors: [
      {
        text_embedding: {
          model_id: modelId,
          field_map: { embed_text: "embedding" },
        },
      },
    ],
  };
}

export const INDEX_BODY = {
  settings: {
    "index.knn": true,
    default_pipeline: INGEST_PIPELINE,
    number_of_shards: 1,
    number_of_replicas: 0,
    analysis: {
      filter: {
        // Plural-only stemmer: singularises product-name plurals (Trainers ->
        // trainer, Boots -> boot) without over-stemming (kstem/porter turn
        // "trainers" -> "train"). Runs BEFORE synonyms so plurals expand them.
        english_stemmer: { type: "stemmer", language: "minimal_english" },
        // True lexical equivalents in singular form. Deliberately NOT bridging
        // intent (office->business, gym->sports) — that is the semantic clause's
        // job and the whole point of the demo.
        fashion_synonyms: {
          type: "synonym_graph",
          synonyms: [
            "bag, handbag",
            "purse, handbag",
            "backpack, rucksack, knapsack",
            "bum bag, belt bag, fanny pack, waist bag",
            "tote, shopper",
            "wallet, billfold",
            "sneaker, trainer, kick",
            "high heel, pump, court shoe",
            "ballet flat, ballerina",
            "loafer, moccasin",
            "jumper, sweater, pullover",
            "trouser, pant, slack",
            "tee, t-shirt, tshirt, t shirt",
            "hoodie, hooded sweatshirt",
            "coat, overcoat",
            "dress, frock",
            "scarf, wrap, shawl",
            "beanie, woolly hat",
            "grey, gray",
            "jewelry, jewellery",
            "colour, color",
          ],
        },
      },
      analyzer: {
        text_en: {
          type: "custom",
          tokenizer: "standard",
          filter: ["lowercase", "asciifolding", "english_stemmer", "stop"],
        },
        text_en_syn: {
          type: "custom",
          tokenizer: "standard",
          filter: [
            "lowercase",
            "asciifolding",
            "english_stemmer",
            "fashion_synonyms",
            "stop",
          ],
        },
      },
    },
  },
  mappings: {
    properties: {
      id: { type: "keyword" },
      name: {
        type: "text",
        analyzer: "text_en",
        fields: {
          syn: {
            type: "text",
            analyzer: "text_en",
            search_analyzer: "text_en_syn",
          },
        },
      },
      description: { type: "text", analyzer: "text_en" },
      brand: { type: "text", fields: { kw: { type: "keyword" } } },
      segment: { type: "keyword" },
      category: { type: "keyword" },
      category_path: { type: "keyword" },
      color: { type: "keyword" },
      material: { type: "keyword" },
      premium: { type: "boolean" },
      sizes: { type: "keyword" },
      images: { type: "keyword", index: false },
      embed_text: { type: "text" },
      embedding: {
        type: "knn_vector",
        dimension: EMBEDDING_DIMENSION,
        method: {
          name: "hnsw",
          engine: "lucene",
          space_type: "cosinesimil",
        },
      },
      price: { type: "float" },
      original_price: { type: "float" },
      discount_pct: { type: "float" },
      in_stock: { type: "boolean" },
      avg_rating: { type: "float" },
      rating_count: { type: "integer" },
    },
  },
};

export const SEARCH_PIPELINE_BODY = {
  description: "normalize + combine hybrid scores",
  phase_results_processors: [
    {
      "normalization-processor": {
        normalization: { technique: "min_max" },
        combination: {
          technique: "arithmetic_mean",
          parameters: { weights: [0.3, 0.7] },
        },
      },
    },
  ],
};
