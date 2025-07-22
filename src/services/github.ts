'use server';

export interface Repository {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    html_url: string;
    description: string | null;
}

const GITHUB_TOKEN = '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';
const GITHUB_API_URL = 'https://api.github.com';

async function githubApi(endpoint: string, options: RequestInit = {}) {
  const url = `${GITHUB_API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `GitHub API request failed: ${response.statusText}`);
  }

  return response.json();
}

export async function getRepositories(): Promise<Repository[]> {
    try {
        return await githubApi('/user/repos?sort=updated&per_page=100');
    } catch (error) {
        console.error("Error fetching repositories:", error);
        return [];
    }
}

export async function createRepository(name: string): Promise<Repository> {
    try {
        const newRepo = await githubApi('/user/repos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                private: true,
                auto_init: true,
            }),
        });
        return newRepo;
    } catch (error) {
        console.error("Error creating repository:", error);
        throw error;
    }
}
