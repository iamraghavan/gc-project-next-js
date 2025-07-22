'use server';

import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from "firebase/firestore"; 


export interface Repository {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    html_url: string;
    description: string | null;
}

export interface File {
    name: string;
    path: string;
    sha: string;
    size: number;
    type: 'file' | 'dir';
    html_url: string;
    download_url: string | null;
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

  // Handle cases where response might be empty
  const text = await response.text();
  return text ? JSON.parse(text) : null;
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
                description: "Created with GitDrive"
            }),
        });
        
        // Add a README to avoid empty repo issues
        await githubApi(`/repos/${newRepo.full_name}/contents/README.md`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Initial commit',
                content: btoa('# GitDrive Repository\n\nThis repository was created by GitDrive.')
            })
        });

        return newRepo;
    } catch (error) {
        console.error("Error creating repository:", error);
        throw error;
    }
}

export async function getRepoContents(params: { repoFullName: string; path?: string }): Promise<File[]> {
    const { repoFullName, path = '' } = params;
    try {
        const contents = await githubApi(`/repos/${repoFullName}/contents/${path}`);
        return contents || [];
    } catch (error) {
        console.error(`Error fetching contents for ${repoFullName} at path ${path}:`, error);
        return [];
    }
}

export async function saveFileMetadata(repoFullName: string, filePath: string, metadata: { expiration: string | null }) {
    try {
        const docId = `${repoFullName}:${filePath}`.replace(/\//g, '_');
        const docRef = doc(db, "fileMetadata", docId);
        await setDoc(docRef, metadata, { merge: true });
    } catch (error) {
        console.error("Error saving file metadata:", error);
        throw error;
    }
}

export async function getFileMetadata(repoFullName: string, filePath: string) {
    try {
        const docId = `${repoFullName}:${filePath}`.replace(/\//g, '_');
        const docRef = doc(db, "fileMetadata", docId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
        console.error("Error getting file metadata:", error);
        return null;
    }
}
