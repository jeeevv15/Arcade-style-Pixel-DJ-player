from itertools import permutations
from compatibility import check_compatibility


def sequence_score(tracks: list) -> float:
    if len(tracks) < 2:
        return 100.0
    total = sum(
        check_compatibility(tracks[i], tracks[i + 1])["overall_score"]
        for i in range(len(tracks) - 1)
    )
    return total / (len(tracks) - 1)


def optimize_sequence(tracks: list) -> dict:
    n = len(tracks)
    if n <= 1:
        return {"optimized": tracks, "score": 100, "improved": False, "method": "TRIVIAL"}

    original_score = sequence_score(tracks)

    # Exhaustive for small sets
    if n <= 7:
        best_order = list(range(n))
        best_score = original_score

        for perm in permutations(range(n)):
            ordered = [tracks[i] for i in perm]
            s = sequence_score(ordered)
            if s > best_score:
                best_score = s
                best_order = list(perm)

        optimized = [tracks[i] for i in best_order]
        method = "EXHAUSTIVE SEARCH"
    else:
        # Greedy nearest-neighbour
        remaining = list(range(n))
        result_idx = [remaining.pop(0)]

        while remaining:
            last = tracks[result_idx[-1]]
            best_next = None
            best_s = -1
            for idx in remaining:
                s = check_compatibility(last, tracks[idx])["overall_score"]
                if s > best_s:
                    best_s = s
                    best_next = idx
            result_idx.append(best_next)
            remaining.remove(best_next)

        optimized = [tracks[i] for i in result_idx]
        best_score = sequence_score(optimized)
        method = "GREEDY OPTIMIZE"

    return {
        "optimized": optimized,
        "score": round(best_score),
        "original_score": round(original_score),
        "improved": best_score > original_score,
        "gain": round(best_score - original_score, 1),
        "method": method,
    }
