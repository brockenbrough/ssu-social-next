import { matrix, eigs, MathNumericType } from 'mathjs';

// Helper function to safely convert MathNumericType to number
function toNumber(val: MathNumericType): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'bigint') return Number(val);
  if ('re' in val) return val.re;       // Complex
  if ('s' in val) return Number(val.s); // BigNumber / Fraction
  return 0;
}

// Define a Post interface for type safety
export interface Post {
  _id: string;
  [key: string]: any; // allow other dynamic properties (title, content, etc.)
}

export interface UserInteractions {
  [postId: string]: string[]; // maps post ID -> array of user IDs or interaction tokens
}

export class PerronSearchAlgorithm {
  private posts: Post[];
  private userInteractions: UserInteractions;
  private adjacencyMatrix: number[][];
  private perronVector: number[];

  constructor(posts: Post[], userInteractions: UserInteractions) {
    if (!Array.isArray(posts)) {
      throw new Error('Posts should be an array');
    }
    this.posts = posts;
    this.userInteractions = userInteractions;
    this.adjacencyMatrix = [];
    this.perronVector = [];
  }

  /** Builds the adjacency matrix based on post similarity */
  buildAdjacencyMatrix(): void {
    const n = this.posts.length;
    this.adjacencyMatrix = Array.from({ length: n }, () => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          this.adjacencyMatrix[i][j] = this.calculateSimilarity(
            this.posts[i],
            this.posts[j]
          );
        }
      }
    }
  }

  /** Calculates similarity between two posts based on shared interactions */
  private calculateSimilarity(postA: Post, postB: Post): number {
    const interactionsA = this.userInteractions[postA._id] || [];
    const interactionsB = this.userInteractions[postB._id] || [];
    const commonInteractions = interactionsA.filter(interaction =>
      interactionsB.includes(interaction)
    );

    return (
      commonInteractions.length /
      Math.max(interactionsA.length, interactionsB.length, 1)
    );
  }

  /** Computes the Perron (principal) eigenvector safely */
  computePerronVector() {
    if (!this.adjacencyMatrix || this.adjacencyMatrix.length === 0) {
      this.perronVector = [];
      return;
    }

    const A = matrix(this.adjacencyMatrix);
    const eigResult = eigs(A);

    // Flatten eigenvalues safely to numbers
    const eigenValues: number[] = Array.from(
      (eigResult.values as unknown) as MathNumericType[]
    ).map(toNumber);

    // Find index of max eigenvalue
    const maxEigenIndex = eigenValues.indexOf(Math.max(...eigenValues));

    // Extract corresponding eigenvector
    const eigenvectorCollection = eigResult.eigenvectors[maxEigenIndex].vector;

    // Convert to plain number array
    const perronVec: number[] = Array.isArray(eigenvectorCollection)
      ? (eigenvectorCollection as MathNumericType[]).map(toNumber)
      : [0]; // fallback

    this.perronVector = perronVec;
  }

  /** Ranks posts based on Perron vector scores */
  rankPosts(): (Post & { score: number })[] {
    return this.posts
      .map((post, index) => ({
        ...post,
        score: this.perronVector[index] || 0,
      }))
      .sort((a, b) => b.score - a.score);
  }

  /** Returns ranked (filtered) posts */
  filterPosts(): (Post & { score: number })[] {
    return this.rankPosts();
  }
}
