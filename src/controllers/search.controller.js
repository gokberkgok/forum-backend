// ====================================================
// SEARCH CONTROLLER (Fastify)
// ====================================================
// Handles advanced topic search with filtering

import prisma from '../config/database.js';

export const searchController = {
    /**
     * Search topics with advanced filtering
     * Limited to 5 pages (50 results) for performance
     */
    searchTopics: async (request, reply) => {
        try {
            const { q, category, page = 1, limit = 10 } = request.query;

            if (!q || q.trim().length < 2) {
                return reply.code(400).send({
                    success: false,
                    error: { message: 'Search query must be at least 2 characters' }
                });
            }

            const queryPage = Math.min(parseInt(page), 5); // Max 5 pages
            const queryLimit = Math.min(parseInt(limit), 10);
            const skip = (queryPage - 1) * queryLimit;

            // Build where clause
            const where = {
                AND: [
                    {
                        OR: [
                            { title: { contains: q.trim(), mode: 'insensitive' } },
                            { content: { contains: q.trim(), mode: 'insensitive' } }
                        ]
                    },
                    category ? { categoryId: category } : {}
                ]
            };

            // Execute search with pagination
            const [topics, totalInRange] = await Promise.all([
                prisma.topic.findMany({
                    where,
                    take: queryLimit,
                    skip,
                    orderBy: [
                        { isPinned: 'desc' },
                        { updatedAt: 'desc' }
                    ],
                    include: {
                        author: {
                            select: {
                                id: true,
                                username: true,
                                displayName: true,
                                avatar: true,
                                role: true
                            }
                        },
                        category: {
                            select: {
                                id: true,
                                name: true,
                                slug: true
                            }
                        },
                        _count: {
                            select: {
                                posts: true,
                                likes: true
                            }
                        }
                    }
                }),
                // Only count up to 50 results (5 pages)
                prisma.topic.count({
                    where,
                    take: 50
                })
            ]);

            const total = Math.min(totalInRange, 50);
            const totalPages = Math.ceil(total / queryLimit);

            return reply.send({
                success: true,
                data: topics,
                pagination: {
                    page: queryPage,
                    limit: queryLimit,
                    total,
                    totalPages,
                    hasMore: queryPage < totalPages
                },
                meta: {
                    query: q.trim(),
                    category: category || null,
                    maxPages: 5
                }
            });
        } catch (error) {
            console.error('Search error:', error);
            return reply.code(500).send({
                success: false,
                error: { message: 'Search failed' }
            });
        }
    }
};
