/**
 * Validate domain name format
 * Allows domains with or without protocol, strips www
 */
export function validateDomain(domain: string): {
  valid: boolean;
  normalized: string;
  errors: string[];
} {
  const errors: string[] = [];
  let normalized = domain.trim().toLowerCase();

  // Remove protocol if present
  normalized = normalized.replace(/^https?:\/\//, '');

  // Remove www. if present
  normalized = normalized.replace(/^www\./, '');

  // Remove trailing slash
  normalized = normalized.replace(/\/$/, '');

  // Remove path, query, and fragment
  normalized = normalized.split('/')[0];
  normalized = normalized.split('?')[0];
  normalized = normalized.split('#')[0];

  // Basic domain regex
  const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;

  if (!normalized) {
    errors.push('Domain cannot be empty');
  } else if (normalized.length > 253) {
    errors.push('Domain is too long (max 253 characters)');
  } else if (!domainRegex.test(normalized)) {
    errors.push('Invalid domain format');
  }

  // Check for localhost or IP addresses (not allowed for SEO projects)
  if (normalized === 'localhost' || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(normalized)) {
    errors.push('Cannot use localhost or IP addresses');
  }

  return {
    valid: errors.length === 0,
    normalized,
    errors,
  };
}

/**
 * Validate project name
 */
export function validateProjectName(name: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const trimmed = name.trim();

  if (!trimmed) {
    errors.push('Project name is required');
  } else if (trimmed.length < 2) {
    errors.push('Project name must be at least 2 characters');
  } else if (trimmed.length > 100) {
    errors.push('Project name is too long (max 100 characters)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate project description
 */
export function validateProjectDescription(description: string | undefined): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (description && description.length > 500) {
    errors.push('Description is too long (max 500 characters)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize project input
 */
export function sanitizeProjectInput(input: {
  name: string;
  domain: string;
  description?: string;
}): {
  name: string;
  domain: string;
  description?: string;
} {
  const domainValidation = validateDomain(input.domain);

  return {
    name: input.name.trim(),
    domain: domainValidation.normalized,
    description: input.description?.trim(),
  };
}
