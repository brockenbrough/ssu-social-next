import natural from "natural";

export default class AIPersonalization {
  private query: string;
  private tokenizer: natural.WordTokenizer;

  constructor(query: string) {
    this.query = query;
    this.tokenizer = new natural.WordTokenizer();
  }

  // Compute AI relevance scores for posts
  computeRelevance(posts: { content: string }[]): number[] {
    const queryTokens = this.preprocessText(this.query);

    return posts.map((post) => {
      const postTokens = this.preprocessText(post.content);
      return this.calculateSimilarity(queryTokens, postTokens);
    });
  }

  // Preprocess text: tokenize, lowercase, and stem
  private preprocessText(text: string): string[] {
    const tokens: string[] = this.tokenizer.tokenize(text.toLowerCase());
    const stemmer = natural.PorterStemmer;
    return tokens.map((token: string) => stemmer.stem(token));
  }

  // Similarity calculation: Jaccard Similarity
  private calculateSimilarity(tokensA: string[], tokensB: string[]): number {
    const setA = new Set(tokensA);
    const setB = new Set(tokensB);

    const intersection = [...setA].filter((token: string) => setB.has(token)).length;
    const union = new Set([...setA, ...setB]).size;

    return union === 0 ? 0 : intersection / union;
  }
}

