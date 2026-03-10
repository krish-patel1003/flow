from __future__ import annotations

from collections import defaultdict, deque

from ..schemas import Pipeline


def topological_order(pipeline: Pipeline) -> list[str]:
    node_ids = [node.id for node in pipeline.nodes]
    indegree = {node_id: 0 for node_id in node_ids}
    adjacency: dict[str, list[str]] = defaultdict(list)

    for edge in pipeline.edges:
        adjacency[edge.source.node_id].append(edge.target.node_id)
        indegree[edge.target.node_id] += 1

    queue = deque([node_id for node_id in node_ids if indegree[node_id] == 0])
    ordered: list[str] = []
    while queue:
        current = queue.popleft()
        ordered.append(current)
        for nxt in adjacency.get(current, []):
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)

    if len(ordered) != len(node_ids):
        raise ValueError("Pipeline contains cycle")
    return ordered
