const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldTimelineStart = `  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e) => {
      // If holding shift, it already scrolls horizontally natively, let it be.
      // Or if the user is scrolling purely horizontally (e.g. touchpad) let it be.
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (e.deltaY === 0) return;
      
      e.preventDefault();
      el.scrollBy({ left: e.deltaY * 0.8, behavior: 'auto' });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);
  
  const sorted = [...articles]`;

const newTimelineStart = `  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -600, behavior: 'smooth' })
  }
  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 600, behavior: 'smooth' })
  }
  
  const sorted = [...articles]`;

code = code.replace(oldTimelineStart, newTimelineStart);

const oldTrack = `      <div ref={scrollRef} className="scroll-thin" style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', padding: '0 32px', scrollBehavior: 'smooth' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', position: 'relative', height: '100%', minHeight: 480, padding: '0 20px' }}>
          
          {/* Continuous Track Line */}`;

const newTrack = `      <div style={{ position: 'relative', flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Navigation Arrows */}
        <button onClick={scrollLeft} style={{
          position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 30,
          width: 40, height: 40, borderRadius: '50%', background: '#fff', border: \`1px solid \${C.lineStrong}\`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)', color: C.teal900
        }}>
          <ChevronLeft size={20} />
        </button>
        <button onClick={scrollRight} style={{
          position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 30,
          width: 40, height: 40, borderRadius: '50%', background: '#fff', border: \`1px solid \${C.lineStrong}\`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)', color: C.teal900
        }}>
          <ChevronRight size={20} />
        </button>

        <div ref={scrollRef} className="scroll-thin" style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', padding: '0 64px', scrollBehavior: 'smooth' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', position: 'relative', height: '100%', minHeight: 480, padding: '0 20px' }}>
            
            {/* Continuous Track Line */}`;

code = code.replace(oldTrack, newTrack);

const oldEndTrack = `            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────`;

const newEndTrack = `            )
          })}
        </div>
      </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────`;
code = code.replace(oldEndTrack, newEndTrack);

fs.writeFileSync('src/App.tsx', code);
