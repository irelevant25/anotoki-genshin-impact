/**
 * Messages sent from the site's contact form.
 *
 * Hand-written: the listing is paged, and the form itself posts a subset of the
 * row that varies by the kind of message being sent.
 */

import { Feedback } from '../models';

export interface FeedbackQuery {
  status?: string;
  type?: string;
  section?: string;
  search?: string;
  page?: number;
}

export interface FeedbackPage {
  total: number;
  page: number;
  pageSize: number;
  items: Feedback[];
}

export interface FeedbackFilters {
  sections: string[];
  statuses: Feedback['status'][];
  types: string[];
  byStatus: Record<string, number>;
  byType: Record<string, number>;
}

export interface FeedbackStatusRequest {
  status: string;
}

/**
 * What the contact form sends. Public: a visitor need not be signed in, and a
 * signed-in one may still send anonymously.
 */
export interface FeedbackRequest {
  type: string;
  /** Drops the sender's identity even when the request carries a token. */
  anonymous?: boolean;
  section?: string | null;
  title?: string | null;
  email?: string | null;
  message?: string | null;
  steps_to_reproduce?: string | null;
  expected_behavior?: string | null;
  actual_behavior?: string | null;
  browser_device_info?: string | null;
  details?: string | null;
  why_important?: string | null;
  additional_info?: string | null;
  page_url?: string | null;
  language?: string | null;
}

/** Echoed back after a status change, so the list can update in place. */
export interface FeedbackStatusChanged {
  id: number;
  status: string;
}
