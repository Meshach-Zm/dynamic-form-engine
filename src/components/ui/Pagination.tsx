'use client';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    onPageChangeAction: (page: number) => void;
}

export function Pagination({
    currentPage,
    totalPages,
    hasNext,
    hasPrev,
    onPageChangeAction,
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);

            if (currentPage > 3) pages.push('...');

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }

        return pages;
    };

    return (
        <div className="flex items-center justify-between border-t border-black/10 pt-4 mt-6">
            <div className="text-sm text-neutral-500">
                Page {currentPage} of {totalPages}
            </div>

            <div className="flex gap-1">
                <button
                    onClick={() => onPageChangeAction(currentPage - 1)}
                    disabled={!hasPrev}
                    className="border border-black/10 px-3 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-black transition"
                >
                    Previous
                </button>

                {getPageNumbers().map((page, index) => {
                    if (page === '...') {
                        return (
                            <span key={`ellipsis-${index}`} className="px-3 py-1.5 text-sm text-neutral-400">
                                …
                            </span>
                        );
                    }

                    return (
                        <button
                            key={index}
                            onClick={() => onPageChangeAction(page as number)}
                            disabled={page === currentPage}
                            className={`border px-3 py-1.5 text-sm transition ${page === currentPage
                                ? 'border-black bg-black text-white'
                                : 'border-black/10 hover:border-black'
                                }`}
                        >
                            {page}
                        </button>
                    );
                })}

                <button
                    onClick={() => onPageChangeAction(currentPage + 1)}
                    disabled={!hasNext}
                    className="border border-black/10 px-3 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-black transition"
                >
                    Next
                </button>
            </div>
        </div>
    );
}