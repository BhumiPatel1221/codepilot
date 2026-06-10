'use client';

import React, { useState } from 'react';
import { X, FileCode, Globe, Lock, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface FormData {
  name: string;
  description: string;
  language: string;
  visibility: 'private' | 'public';
}

interface FormErrors {
  name?: string;
}

const languages = [
  { value: 'typescript', label: 'TypeScript', color: '#3178c6' },
  { value: 'python', label: 'Python', color: '#3776ab' },
  { value: 'javascript', label: 'JavaScript', color: '#f1e05a' },
  { value: 'java', label: 'Java', color: '#b07219' },
  { value: 'cpp', label: 'C++', color: '#f34b7d' },
  { value: 'rust', label: 'Rust', color: '#dea584' },
];

interface Props {
  onClose: () => void;
}

export default function CreateWorkspaceModal({ onClose }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [selectedLang, setSelectedLang] = useState(languages[0]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    language: 'typescript',
    visibility: 'private',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name) {
      newErrors.name = 'Workspace name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Must be at least 2 characters';
    } else if (!/^[a-z0-9-_]+$/i.test(formData.name)) {
      newErrors.name = 'Only letters, numbers, hyphens, and underscores';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !user) return;
    
    setIsCreating(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/api/save-project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          language: formData.language,
          visibility: formData.visibility,
          ownerId: user.id,
          ownerName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          files: [],
        }),
      });

      if (!response.ok) throw new Error('Failed to create workspace');
      const data = await response.json();
      
      onClose();
      router.push(`/ide-workspace?id=${data.id}`);
    } catch (error) {
      console.error(error);
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative monochrome-card rounded-2xl shadow-modal w-full max-w-md animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileCode size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">New workspace</h2>
              <p className="text-xs text-muted-foreground">Set up your coding environment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Workspace name <span className="text-red-500">*</span>
            </label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="my-awesome-project"
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent font-mono transition-all duration-150"
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Description</label>
            <p className="text-xs text-muted-foreground mb-1.5">
              Brief summary of what this workspace is for
            </p>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              placeholder="A REST API for user authentication..."
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none transition-all duration-150"
            />
          </div>

          {/* Language */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Primary language <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm bg-background border border-input rounded-lg text-foreground hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-150"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: selectedLang.color }}
                  />
                  {selectedLang.label}
                </span>
                <ChevronDown size={14} className="text-muted-foreground" />
              </button>
              {showLangDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 monochrome-card rounded-lg shadow-dropdown z-10 overflow-hidden animate-scale-in">
                  {languages.map((lang) => (
                    <button
                      key={`lang-${lang.value}`}
                      type="button"
                      onClick={() => {
                        setSelectedLang(lang);
                        setFormData({ ...formData, language: lang.value });
                        setShowLangDropdown(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted text-foreground transition-colors duration-100"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: lang.color }}
                      />
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-2">Visibility</label>
            <div className="grid grid-cols-2 gap-2">
              {(['private', 'public'] as const).map((v) => (
                <button
                  key={`vis-${v}`}
                  type="button"
                  onClick={() => setFormData({ ...formData, visibility: v })}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm transition-all duration-150 ${
                    formData.visibility === v
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:border-border/80 hover:text-foreground'
                  }`}
                >
                  {v === 'private' ? <Lock size={14} /> : <Globe size={14} />}
                  <span className="font-medium capitalize">{v}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground bg-muted rounded-lg hover:text-foreground hover:bg-muted/80 transition-all duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex-1 btn-primary flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg disabled:opacity-60"
              style={{ minWidth: '140px' }}
            >
              {isCreating ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Creating...
                </>
              ) : (
                'Create workspace'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
