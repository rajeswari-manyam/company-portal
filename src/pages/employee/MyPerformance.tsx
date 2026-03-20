import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPerformanceReviews, type PerformanceReview } from '../../data/store';
import { Card, Badge, EmptyState } from '../../components/ui';
import { PageHeader } from '../../components/common';
import { formatDate } from '../../utils/helpers';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(s => (
        <span key={s} className={`text-lg ${s <= Math.round(rating) ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
      ))}
      <span className="ml-1 text-sm font-bold text-slate-700">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function MyPerformance() {
  const { user } = useAuth();
  const reviews = getPerformanceReviews(user?.id);

  return (
    <div className="space-y-6">
      <PageHeader title="My Performance" subtitle="View your performance reviews and ratings" />
      {reviews.length === 0 ? (
        <EmptyState icon="⭐" message="No reviews yet" description="Your performance reviews will appear here once submitted." />
      ) : (
        <div className="space-y-4">
          {reviews.map((r: PerformanceReview) => (
            <Card key={r.id}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-800">{r.period}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Reviewed by {r.reviewedBy ?? 'Pending'} · {formatDate(r.createdAt)}</p>
                </div>
                <Badge status={r.status} />
              </div>
              <StarRating rating={r.rating} />
              {r.feedback && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Feedback</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{r.feedback}</p>
                </div>
              )}
              {r.goals.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Goals</p>
                  <ul className="space-y-1">
                    {r.goals.map((g, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="text-[#0B0E92] mt-0.5 flex-shrink-0">✓</span>
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
