import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import client from '../../api/client.js';
import styles from './NeighborGraph.module.css';

const GROUP_CONFIG = {
  you: {
    color: '#ef4444',
    label: 'You (Target User)',
    badgeBg: 'rgba(239, 68, 68, 0.2)',
    badgeColor: '#fca5a5',
    radius: 14,
  },
  neighbor: {
    color: '#3b82f6',
    label: 'Similar User',
    badgeBg: 'rgba(59, 130, 246, 0.2)',
    badgeColor: '#93c5fd',
    radius: 10,
  },
  shared: {
    color: '#f59e0b',
    label: 'Shared Movie',
    badgeBg: 'rgba(245, 158, 11, 0.2)',
    badgeColor: '#fcd34d',
    radius: 8,
  },
  recommended: {
    color: '#10b981',
    label: 'Recommended Movie',
    badgeBg: 'rgba(16, 185, 129, 0.2)',
    badgeColor: '#6ee7b7',
    radius: 12,
  },
};

const NeighborGraph = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [width, setWidth] = useState(0);
  const [hoverNode, setHoverNode] = useState(null);

  const containerRef = useRef(null);
  const fgRef = useRef(null);

  useEffect(() => {
    client
      .get('/recommendations/graph')
      .then((res) => {
        if (res.data.nodes && res.data.nodes.length > 0) {
          setData(res.data);
        } else {
          setError('no-data');
        }
      })
      .catch((err) => {
        console.error('Graph fetch failed', err);
        setError('fetch-failed');
      })
      .finally(() => setLoading(false));
  }, []);

  const containerCallback = useCallback((node) => {
    if (node) {
      containerRef.current = node;
      setWidth(node.getBoundingClientRect().width || node.offsetWidth || 750);
    }
  }, []);

  // Configure D3 physics forces for optimal spacing
  useEffect(() => {
    if (!fgRef.current || !data) return;

    // Stronger negative charge keeps nodes spaced apart
    const charge = fgRef.current.d3Force('charge');
    if (charge) {
      charge.strength(-550).distanceMax(550);
    }

    // Link distance gives edges room to breathe
    const link = fgRef.current.d3Force('link');
    if (link) {
      link.distance((l) => (l.type === 'recommendation' ? 130 : 95));
    }
  }, [data]);

  // Set of connected nodes & links for hover highlight
  const { highlightNodes, highlightLinks } = useMemo(() => {
    const hNodes = new Set();
    const hLinks = new Set();

    if (hoverNode && data) {
      hNodes.add(hoverNode.id);
      data.links.forEach((link) => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        if (sourceId === hoverNode.id || targetId === hoverNode.id) {
          hLinks.add(link);
          hNodes.add(sourceId);
          hNodes.add(targetId);
        }
      });
    }

    return { highlightNodes: hNodes, highlightLinks: hLinks };
  }, [hoverNode, data]);

  const handleZoomIn = () => {
    if (fgRef.current) {
      fgRef.current.zoom(fgRef.current.zoom() * 1.3, 300);
    }
  };

  const handleZoomOut = () => {
    if (fgRef.current) {
      fgRef.current.zoom(fgRef.current.zoom() * 0.75, 300);
    }
  };

  const handleFit = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400, 45);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading recommender network...</div>
      </div>
    );
  }

  if (error || !data) return null;

  return (
    <div className={styles.container} ref={containerCallback}>
      <div className={styles.headerRow}>
        <div>
          <h3 className={styles.heading}>Your Recommender Network</h3>
          <p className={styles.desc}>
            Visualizing the collaborative filtering paths that generated your recommendations.
            Hover over nodes to trace connections.
          </p>
        </div>
        <div className={styles.controls}>
          <button type="button" className={styles.btn} onClick={handleZoomIn} title="Zoom in">
            + Zoom In
          </button>
          <button type="button" className={styles.btn} onClick={handleZoomOut} title="Zoom out">
            − Zoom Out
          </button>
          <button type="button" className={styles.btn} onClick={handleFit} title="Fit to view">
            ⛶ Fit View
          </button>
        </div>
      </div>

      {width > 0 && (
        <div className={styles.graphWrapper}>
          <ForceGraph2D
            ref={fgRef}
            width={width}
            height={480}
            graphData={data}
            backgroundColor="#0b0f19"
            d3VelocityDecay={0.35}
            warmupTicks={60}
            cooldownTicks={120}
            onEngineStop={handleFit}
            onNodeHover={(node) => setHoverNode(node || null)}
            linkWidth={(link) => (highlightLinks.has(link) ? 2.5 : 1.2)}
            linkColor={(link) => {
              if (hoverNode && !highlightLinks.has(link)) {
                return 'rgba(255, 255, 255, 0.05)';
              }
              if (link.type === 'recommendation') {
                return 'rgba(16, 185, 129, 0.65)';
              }
              if (link.type === 'shared_you') {
                return 'rgba(245, 158, 11, 0.5)';
              }
              return 'rgba(59, 130, 246, 0.45)';
            }}
            linkDirectionalParticles={(link) => (link.type === 'recommendation' ? 2 : 0)}
            linkDirectionalParticleSpeed={0.006}
            linkDirectionalParticleWidth={2.5}
            linkDirectionalParticleColor={() => '#10b981'}
            nodeCanvasObjectMode={() => 'replace'}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const cfg = GROUP_CONFIG[node.group] || GROUP_CONFIG.shared;
              const r = cfg.radius;
              const isHovered = hoverNode && hoverNode.id === node.id;
              const isConnected = highlightNodes.has(node.id);
              const isDimmed = hoverNode && !isConnected;

              ctx.save();
              ctx.globalAlpha = isDimmed ? 0.2 : 1.0;

              // Outer glow ring on hover
              if (isHovered) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, r + 5, 0, 2 * Math.PI, false);
                ctx.fillStyle = cfg.badgeBg;
                ctx.fill();
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = cfg.color;
                ctx.stroke();
              }

              // Base circle
              ctx.beginPath();
              ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
              ctx.fillStyle = cfg.color;
              ctx.fill();
              ctx.lineWidth = isHovered ? 2 : 1.2;
              ctx.strokeStyle = '#ffffff';
              ctx.stroke();

              // Node Icon / Short Label in center
              ctx.font = `bold ${Math.max(6, r * 0.75)}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = '#ffffff';
              if (node.group === 'you') {
                ctx.fillText('YOU', node.x, node.y);
              } else if (node.group === 'recommended') {
                ctx.fillText('★', node.x, node.y);
              } else if (node.group === 'neighbor') {
                ctx.fillText('U', node.x, node.y);
              } else {
                ctx.fillText('●', node.x, node.y);
              }

              // Node text label with dark pill background
              if (globalScale > 0.7 || isHovered || node.group === 'you' || node.group === 'recommended') {
                const label = node.label || '';
                const short = label.length > 20 ? `${label.slice(0, 18)}…` : label;
                const fontSize = Math.max(9, 11 / globalScale);
                ctx.font = `${fontSize}px sans-serif`;

                const textWidth = ctx.measureText(short).width;
                const pillPadding = 4;
                const pillX = node.x - textWidth / 2 - pillPadding;
                const pillY = node.y + r + 4;
                const pillW = textWidth + pillPadding * 2;
                const pillH = fontSize + pillPadding;

                // Draw pill background
                ctx.fillStyle = 'rgba(11, 15, 25, 0.88)';
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.roundRect(pillX, pillY, pillW, pillH, 4);
                ctx.fill();
                ctx.stroke();

                // Draw pill text
                ctx.fillStyle = isHovered ? '#60a5fa' : '#f8fafc';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(short, node.x, pillY + pillH / 2);
              }

              ctx.restore();
            }}
          />

          {/* Hover Inspector Card */}
          {hoverNode && (
            <div className={styles.inspectorCard}>
              <div className={styles.inspectorTitle}>{hoverNode.label}</div>
              <span
                className={styles.inspectorBadge}
                style={{
                  background: (GROUP_CONFIG[hoverNode.group] || GROUP_CONFIG.shared).badgeBg,
                  color: (GROUP_CONFIG[hoverNode.group] || GROUP_CONFIG.shared).badgeColor,
                }}
              >
                {(GROUP_CONFIG[hoverNode.group] || GROUP_CONFIG.shared).label}
              </span>
              <div className={styles.inspectorDetail}>
                {hoverNode.group === 'you' && 'The root user profile for these recommendations.'}
                {hoverNode.group === 'neighbor' &&
                  `Pearson Similarity: ${(hoverNode.similarity ?? 0).toFixed(2)} to your ratings.`}
                {hoverNode.group === 'shared' &&
                  'A movie both you and your neighbors rated positively.'}
                {hoverNode.group === 'recommended' &&
                  'Predicted film recommended based on your neighbors’ high ratings.'}
              </div>
            </div>
          )}

          <div className={styles.hint}>💡 Drag nodes to rearrange · Hover to trace connections</div>
        </div>
      )}

      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.dot} style={{ background: '#ef4444' }} /> You
        </span>
        <span className={styles.legendItem}>
          <span className={styles.dot} style={{ background: '#3b82f6' }} /> Similar Users
        </span>
        <span className={styles.legendItem}>
          <span className={styles.dot} style={{ background: '#f59e0b' }} /> Shared Movies
        </span>
        <span className={styles.legendItem}>
          <span className={styles.dot} style={{ background: '#10b981' }} /> Recommended
        </span>
      </div>
    </div>
  );
};

export default NeighborGraph;
