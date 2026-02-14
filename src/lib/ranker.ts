import { Rating, quality_1vs1, rate_1vs1 } from 'ts-trueskill';

const epsilon = 1e-9;
type RatingsById = Record<string, Rating>;

const initialSigma = new Rating().sigma;

export const leaderboardConfidence = (ratings: Rating[]) => {
	if (ratings.length < 2) return 0;
	const avgSigma = ratings.reduce((sum, r) => sum + r.sigma, 0) / ratings.length;
	return (1 - avgSigma / initialSigma) * 100;
};

export const createRatings = <T extends { id: string }>(items: T[]) =>
	Object.fromEntries(items.map((item) => [item.id, new Rating()]));

export const pairInfoScore = (left: Rating, right: Rating) => {
	const muDistance = Math.max(Math.abs(left.mu - right.mu), epsilon);
	const uncertainty = left.sigma + right.sigma;
	const quality = quality_1vs1(left, right);
	return quality * (uncertainty / muDistance);
};

export const pickNextPair = <T extends { id: string }>(items: T[], ratingsById: RatingsById) => {
	let bestScore = Number.NEGATIVE_INFINITY;
	let bestPairs: [T, T][] = [];

	for (let i = 0; i < items.length - 1; i += 1) {
		for (let j = i + 1; j < items.length; j += 1) {
			const left = items[i];
			const right = items[j];
			const score = pairInfoScore(ratingsById[left.id], ratingsById[right.id]);

			if (score > bestScore + epsilon) {
				bestScore = score;
				bestPairs = [[left, right]];
				continue;
			}

			if (Math.abs(score - bestScore) <= epsilon) {
				bestPairs.push([left, right]);
			}
		}
	}

	const pair = bestPairs[Math.floor(Math.random() * bestPairs.length)];

	if (Math.random() < 0.5) {
		return [pair[1], pair[0]];
	}

	return pair;
};

export const applyResult = (ratingsById: RatingsById, winnerId: string, loserId: string) => {
	const [winner, loser] = rate_1vs1(ratingsById[winnerId], ratingsById[loserId]);
	ratingsById[winnerId] = winner;
	ratingsById[loserId] = loser;
};