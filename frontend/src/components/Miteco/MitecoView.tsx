import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Bird,
  Search,
  RefreshCw,
  Eye,
  Download,
  X,
  MapPin,
  Calendar,
  Layers,
  ExternalLink,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpDown,
  FileText,
  CheckCircle2,
  BookOpen,
  HelpCircle,
} from 'lucide-react';
import {
  MitecoZepaSummary,
  ZepaRecord,
  ZepaSpeciesRecord,
} from '../../types/sightings';
import {
  fetchMitecoSummary,
  fetchMitecoZepas,
  fetchMitecoZepaDetails,
} from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

export const MitecoView: React.FC = () => {
  const { colors } = useTheme();
  const inputBg = colors.mainBg;
  const cardHover = colors.tableRowHover;

  // Estados de datos
  const [summary, setSummary] = useState<MitecoZepaSummary | null>(null);
  const [zepas, setZepas] = useState<ZepaRecord[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Estados de filtrado y paginación
  const [typeFilter, setTypeFilter] = useState<string>('ALL'); // 'ALL' | 'A' | 'C'
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [sortBy, setSortBy] = useState<string>('sitecode');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Estados de carga
  const [loadingSummary, setLoadingSummary] = useState<boolean>(true);
  const [loadingZepas, setLoadingZepas] = useState<boolean>(false);

  // Modal de detalle de ZEPA y sus aves
  const [selectedZepaCode, setSelectedZepaCode] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [modalZepa, setModalZepa] = useState<ZepaRecord | null>(null);
  const [modalSpecies, setModalSpecies] = useState<ZepaSpeciesRecord[]>([]);
  const [speciesSearch, setSpeciesSearch] = useState<string>('');
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  // 1. Cargar Resumen oficial MITECO
  const loadSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const data = await fetchMitecoSummary();
      setSummary(data);
    } catch (err) {
      console.error('Error al cargar resumen MITECO:', err);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // 2. Cargar ZEPAs paginadas y filtradas
  const loadZepas = useCallback(async () => {
    setLoadingZepas(true);
    try {
      const res = await fetchMitecoZepas({
        page,
        pageSize,
        search: searchTerm,
        sitetype: typeFilter !== 'ALL' ? typeFilter : undefined,
        sortBy,
        sortOrder,
      });
      setZepas(res.rows);
      setTotalCount(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Error al cargar ZEPAs:', err);
    } finally {
      setLoadingZepas(false);
    }
  }, [page, pageSize, searchTerm, typeFilter, sortBy, sortOrder]);

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      loadZepas();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadZepas]);

  // 3. Cargar detalle de ZEPA al abrir modal
  const openZepaDetail = async (zepa: ZepaRecord) => {
    setSelectedZepaCode(zepa.sitecode);
    setModalZepa(zepa);
    setModalSpecies([]);
    setSpeciesSearch('');
    setModalLoading(true);

    try {
      const detail = await fetchMitecoZepaDetails(zepa.sitecode);
      setModalZepa(detail.zepa || zepa);
      setModalSpecies(detail.species || []);
    } catch (err) {
      console.error('Error al cargar detalle de ZEPA:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedZepaCode(null);
    setModalZepa(null);
    setModalSpecies([]);
    setSpeciesSearch('');
  };

  // Filtrado interno de especies en el modal
  const filteredModalSpecies = useMemo(() => {
    if (!speciesSearch.trim()) return modalSpecies;
    const term = speciesSearch.toLowerCase();
    return modalSpecies.filter(
      (s) =>
        s.speciesname.toLowerCase().includes(term) ||
        s.speciescode.toLowerCase().includes(term) ||
        (s.counting_unit && s.counting_unit.toLowerCase().includes(term))
    );
  }, [modalSpecies, speciesSearch]);

  // Cambio de ordenación
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  // Exportar vista actual a CSV
  const exportToCSV = () => {
    if (!zepas || zepas.length === 0) return;
    const headers = [
      'Código ZEPA',
      'Nombre Oficial',
      'Tipo Directiva',
      'Fecha Declaración',
      'Referencia Legal / Decreto',
      'Superficie (ha)',
      '% Área Marina',
      'Especies Aves Censadas',
      'Longitud',
      'Latitud',
    ];

    const rows = zepas.map((z) => [
      `"${z.sitecode}"`,
      `"${(z.sitename || '').replace(/"/g, '""')}"`,
      `"${z.sitetype === 'A' ? 'Tipo A (Exclusiva ZEPA)' : 'Tipo C (ZEPA coincidente con LIC)'}"`,
      `"${z.date_spa ? z.date_spa.split('T')[0] : ''}"`,
      `"${(z.spa_legal_reference || '').replace(/"/g, '""')}"`,
      z.areaha || 0,
      z.marine_area_percentage || 0,
      z.bird_species_count || 0,
      z.longitude || '',
      z.latitude || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Directiva_Aves_ZEPAs_Españolas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPopulationTypeLabel = (type: string | null) => {
    switch (type) {
      case 'p':
        return 'Residente (Población Permanente)';
      case 'r':
        return 'Reproductora';
      case 'w':
        return 'Invernante';
      case 'c':
        return 'Paso / Concentración';
      default:
        return type || 'Presencia Registrada';
    }
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '28px', color: colors.textPrimary }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* 1. CABECERA PRINCIPAL */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '28px',
          backgroundColor: colors.cardBg,
          padding: '24px 28px',
          borderRadius: '16px',
          border: `1px solid ${colors.cardBorder}`,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
              }}
            >
              <Bird size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
                  Directiva Aves: ZEPAs de España
                </h1>
                <span
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '20px',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  Directiva 2009/147/CE
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: colors.textSecondary }}>
                Base de datos oficial de Zonas de Especial Protección para las Aves (Red Natura 2000 - MITECO). Información exclusiva sobre las 658 ZEPAs españolas y sus censos ornitológicos.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setShowHelpModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 15px',
                borderRadius: '10px',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                color: '#2563eb',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Guía y leyenda explicativa de los códigos oficiales (ZEPA Tipo A/C, Población, Abundancia, Conservación)"
            >
              <HelpCircle size={16} />
              Ayuda Códigos
            </button>

            <button
              onClick={() => {
                loadSummary();
                loadZepas();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 14px',
                borderRadius: '10px',
                backgroundColor: inputBg,
                color: colors.textPrimary,
                border: `1px solid ${colors.cardBorder}`,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Actualizar datos oficiales"
            >
              <RefreshCw size={15} className={loadingZepas ? 'spin' : ''} />
              Actualizar
            </button>

            <button
              onClick={exportToCSV}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '10px',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
              }}
              title="Exportar ZEPAs listadas a formato CSV"
            >
              <Download size={15} />
              Exportar CSV
            </button>
          </div>
        </div>
      </div>

      {/* 2. TARJETAS DE INDICADORES OFICIALES (KPIs) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* KPI 1: Total ZEPAs */}
        <div
          style={{
            backgroundColor: colors.cardBg,
            borderRadius: '14px',
            padding: '20px',
            border: `1px solid ${colors.cardBorder}`,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Espacios ZEPA Oficiales
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: colors.textPrimary, lineHeight: 1.2 }}>
              {loadingSummary ? '...' : (summary?.totalZepas || 658).toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
              387 Tipo A · 271 Tipo C
            </div>
          </div>
        </div>

        {/* KPI 2: Superficie Total */}
        <div
          style={{
            backgroundColor: colors.cardBg,
            borderRadius: '14px',
            padding: '20px',
            border: `1px solid ${colors.cardBorder}`,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Layers size={24} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Superficie Protegida
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: colors.textPrimary, lineHeight: 1.2 }}>
              {loadingSummary
                ? '...'
                : `${((summary?.totalAreaHa || 16411214) / 1000000).toFixed(2)} M ha`}
            </div>
            <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
              {loadingSummary ? '...' : `${(summary?.totalAreaHa || 16411214).toLocaleString()} hectáreas`}
            </div>
          </div>
        </div>

        {/* KPI 3: Registros de Especies */}
        <div
          style={{
            backgroundColor: colors.cardBg,
            borderRadius: '14px',
            padding: '20px',
            border: `1px solid ${colors.cardBorder}`,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(168, 85, 247, 0.12)',
              color: '#a855f7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Censos Oficiales de Aves
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: colors.textPrimary, lineHeight: 1.2 }}>
              {loadingSummary ? '...' : (summary?.totalBirdSpeciesRecords || 30331).toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
              Registros poblacionales en ZEPAs
            </div>
          </div>
        </div>

        {/* KPI 4: Especies Únicas */}
        <div
          style={{
            backgroundColor: colors.cardBg,
            borderRadius: '14px',
            padding: '20px',
            border: `1px solid ${colors.cardBorder}`,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Bird size={24} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Avifauna Catalogada
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: colors.textPrimary, lineHeight: 1.2 }}>
              {loadingSummary ? '...' : `${summary?.uniqueBirdSpeciesCount || 265} especies`}
            </div>
            <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
              Amparadas en Directiva Aves
            </div>
          </div>
        </div>
      </div>

      {/* 3. BARRA DE FILTROS, SELECTOR DE TIPO Y BÚSQUEDA */}
      <div
        style={{
          backgroundColor: colors.cardBg,
          borderRadius: '16px',
          border: `1px solid ${colors.cardBorder}`,
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          {/* Selector de Tipo de ZEPA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: colors.textSecondary, marginRight: '4px' }}>
              <Filter size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
              Tipo:
            </span>

            <button
              onClick={() => {
                setTypeFilter('ALL');
                setPage(1);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                backgroundColor: typeFilter === 'ALL' ? '#10b981' : inputBg,
                color: typeFilter === 'ALL' ? '#ffffff' : colors.textPrimary,
                transition: 'all 0.15s ease',
              }}
            >
              Todas ({summary?.totalZepas || 658})
            </button>

            <button
              onClick={() => {
                setTypeFilter('A');
                setPage(1);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                backgroundColor: typeFilter === 'A' ? '#10b981' : inputBg,
                color: typeFilter === 'A' ? '#ffffff' : colors.textPrimary,
                transition: 'all 0.15s ease',
              }}
              title="Sitios clasificados exclusivamente como Zonas de Especial Protección para las Aves (Tipo A)"
            >
              ZEPA Exclusiva · Tipo A ({summary?.pureZepasCount || 387})
            </button>

            <button
              onClick={() => {
                setTypeFilter('C');
                setPage(1);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                backgroundColor: typeFilter === 'C' ? '#10b981' : inputBg,
                color: typeFilter === 'C' ? '#ffffff' : colors.textPrimary,
                transition: 'all 0.15s ease',
              }}
              title="Sitios declarados simultáneamente como ZEPA y como Lugar de Importancia Comunitaria LIC (Tipo C)"
            >
              ZEPA Coincidente con LIC · Tipo C ({summary?.coincidentZepasCount || 271})
            </button>
          </div>

          {/* Selector de Tamaño de Página */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: colors.textSecondary }}>Mostrar:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              style={{
                backgroundColor: inputBg,
                color: colors.textPrimary,
                border: `1px solid ${colors.cardBorder}`,
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              <option value={10}>10 por pág.</option>
              <option value={25}>25 por pág.</option>
              <option value={50}>50 por pág.</option>
              <option value={100}>100 por pág.</option>
            </select>
          </div>
        </div>

        {/* Input de Búsqueda rápida */}
        <div style={{ position: 'relative', width: '100%' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: colors.textSecondary,
            }}
          />
          <input
            type="text"
            placeholder="Buscar por nombre oficial, código ZEPA (ej. ES0000001), referencia legal o decreto..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              padding: '11px 40px 11px 42px',
              backgroundColor: inputBg,
              color: colors.textPrimary,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: '10px',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setPage(1);
              }}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: colors.textSecondary,
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 4. TABLA PRINCIPAL DE ZEPAS */}
      <div
        style={{
          backgroundColor: colors.cardBg,
          borderRadius: '16px',
          border: `1px solid ${colors.cardBorder}`,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            padding: '14px 20px',
            borderBottom: `1px solid ${colors.cardBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: 600, color: colors.textSecondary }}>
            {loadingZepas ? (
              'Cargando ZEPAs...'
            ) : (
              <span>
                Mostrando <strong style={{ color: colors.textPrimary }}>{zepas.length}</strong> de{' '}
                <strong style={{ color: colors.textPrimary }}>{totalCount}</strong> ZEPAs encontradas
              </span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: colors.textSecondary }}>
            Página {page} de {Math.max(1, totalPages)}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderBottom: `1px solid ${colors.cardBorder}` }}>
                <th
                  onClick={() => handleSort('sitecode')}
                  style={{
                    padding: '12px 16px',
                    fontWeight: 700,
                    color: colors.textSecondary,
                    cursor: 'pointer',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Código ZEPA
                    <ArrowUpDown size={13} style={{ opacity: sortBy === 'sitecode' ? 1 : 0.4 }} />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('sitename')}
                  style={{
                    padding: '12px 16px',
                    fontWeight: 700,
                    color: colors.textSecondary,
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Nombre Oficial del Espacio
                    <ArrowUpDown size={13} style={{ opacity: sortBy === 'sitename' ? 1 : 0.4 }} />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('sitetype')}
                  style={{
                    padding: '12px 16px',
                    fontWeight: 700,
                    color: colors.textSecondary,
                    cursor: 'pointer',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Tipo
                    <ArrowUpDown size={13} style={{ opacity: sortBy === 'sitetype' ? 1 : 0.4 }} />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('date_spa')}
                  style={{
                    padding: '12px 16px',
                    fontWeight: 700,
                    color: colors.textSecondary,
                    cursor: 'pointer',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Fecha Declaración
                    <ArrowUpDown size={13} style={{ opacity: sortBy === 'date_spa' ? 1 : 0.4 }} />
                  </div>
                </th>

                <th style={{ padding: '12px 16px', fontWeight: 700, color: colors.textSecondary }}>
                  Referencia Legal / Decreto
                </th>

                <th
                  onClick={() => handleSort('areaha')}
                  style={{
                    padding: '12px 16px',
                    fontWeight: 700,
                    color: colors.textSecondary,
                    cursor: 'pointer',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    textAlign: 'right',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    Superficie (ha)
                    <ArrowUpDown size={13} style={{ opacity: sortBy === 'areaha' ? 1 : 0.4 }} />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('bird_species_count')}
                  style={{
                    padding: '12px 16px',
                    fontWeight: 700,
                    color: colors.textSecondary,
                    cursor: 'pointer',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    Aves Censadas
                    <ArrowUpDown size={13} style={{ opacity: sortBy === 'bird_species_count' ? 1 : 0.4 }} />
                  </div>
                </th>

                <th style={{ padding: '12px 16px', fontWeight: 700, color: colors.textSecondary, textAlign: 'center' }}>
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {loadingZepas ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: colors.textSecondary }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                      <RefreshCw size={20} className="spin" />
                      <span>Cargando datos de ZEPAs oficiales...</span>
                    </div>
                  </td>
                </tr>
              ) : zepas.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: colors.textSecondary }}>
                    No se encontraron ZEPAs con los criterios de búsqueda seleccionados.
                  </td>
                </tr>
              ) : (
                zepas.map((z) => (
                  <tr
                    key={z.sitecode}
                    onClick={() => openZepaDetail(z)}
                    style={{
                      borderBottom: `1px solid ${colors.cardBorder}`,
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = cardHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* Código */}
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#10b981', whiteSpace: 'nowrap' }}>
                      {z.sitecode}
                    </td>

                    {/* Nombre */}
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: colors.textPrimary, minWidth: '220px' }}>
                      {z.sitename}
                    </td>

                    {/* Tipo */}
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      {z.sitetype === 'A' ? (
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            display: 'inline-block',
                          }}
                          title="ZEPA Exclusiva"
                        >
                          Tipo A · Exclusiva
                        </span>
                      ) : (
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: 'rgba(59, 130, 246, 0.15)',
                            color: '#3b82f6',
                            display: 'inline-block',
                          }}
                          title="ZEPA Coincidente con LIC"
                        >
                          Tipo C · ZEPA/LIC
                        </span>
                      )}
                    </td>

                    {/* Fecha Declaración */}
                    <td style={{ padding: '12px 16px', color: colors.textSecondary, whiteSpace: 'nowrap' }}>
                      {z.date_spa ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <Calendar size={13} style={{ opacity: 0.6 }} />
                          {z.date_spa.split('T')[0]}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* Referencia Legal */}
                    <td
                      style={{
                        padding: '12px 16px',
                        color: colors.textSecondary,
                        fontSize: '12px',
                        maxWidth: '240px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={z.spa_legal_reference || ''}
                    >
                      {z.spa_legal_reference || '-'}
                    </td>

                    {/* Superficie */}
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {Math.round(z.areaha || 0).toLocaleString()} ha
                    </td>

                    {/* Aves Censadas */}
                    <td style={{ padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 9px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 700,
                          backgroundColor: z.bird_species_count > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                          color: z.bird_species_count > 0 ? '#f59e0b' : '#94a3b8',
                        }}
                      >
                        <Bird size={13} />
                        {z.bird_species_count}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td style={{ padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openZepaDetail(z);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          backgroundColor: inputBg,
                          color: colors.textPrimary,
                          border: `1px solid ${colors.cardBorder}`,
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                        title="Ver ficha técnica completa y especies de aves censadas"
                      >
                        <Eye size={14} />
                        Ver Ficha
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN INFERIOR */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: `1px solid ${colors.cardBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(0,0,0,0.02)',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '12px', color: colors.textSecondary }}>
            Página {page} de {Math.max(1, totalPages)} ({totalCount} ZEPAs registradas)
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: inputBg,
                color: colors.textPrimary,
                border: `1px solid ${colors.cardBorder}`,
                fontSize: '12px',
                fontWeight: 600,
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                opacity: page <= 1 ? 0.5 : 1,
              }}
            >
              <ChevronLeft size={16} />
              Anterior
            </button>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: inputBg,
                color: colors.textPrimary,
                border: `1px solid ${colors.cardBorder}`,
                fontSize: '12px',
                fontWeight: 600,
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                opacity: page >= totalPages ? 0.5 : 1,
              }}
            >
              Siguiente
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 5. MODAL DE FICHA TÉCNICA Y ESPECIES DE AVES CENSADAS */}
      {selectedZepaCode && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px',
          }}
          onClick={closeModal}
        >
          <div
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: '20px',
              border: `1px solid ${colors.cardBorder}`,
              width: '100%',
              maxWidth: '920px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Modal */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: `1px solid ${colors.cardBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Bird size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#10b981', fontSize: '16px' }}>
                      {modalZepa?.sitecode}
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor:
                          modalZepa?.sitetype === 'A' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        color: modalZepa?.sitetype === 'A' ? '#10b981' : '#3b82f6',
                      }}
                    >
                      {modalZepa?.sitetype === 'A' ? 'ZEPA Exclusiva (Tipo A)' : 'ZEPA Coincidente LIC (Tipo C)'}
                    </span>
                    {modalZepa?.sitecode && (
                      <a
                        href={`https://natura2000.eea.europa.eu/Natura2000/sdf/#/sdf?site=${encodeURIComponent(modalZepa.sitecode)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: 'rgba(37, 99, 235, 0.12)',
                          color: '#2563eb',
                          textDecoration: 'none',
                        }}
                        title={`Abrir Formulario Normalizado de Datos (SDF) oficial de ${modalZepa.sitecode} en Natura 2000`}
                      >
                        SDF Oficial <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '3px 0 0 0', color: colors.textPrimary }}>
                    {modalZepa?.sitename}
                  </h2>
                </div>
              </div>

              <button
                onClick={closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.textSecondary,
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '8px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido con Scroll */}
            <div style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* Metadatos en Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '14px',
                  backgroundColor: inputBg,
                  padding: '16px',
                  borderRadius: '12px',
                  border: `1px solid ${colors.cardBorder}`,
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: colors.textSecondary }}>SUPERFICIE TOTAL</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '2px' }}>
                    {Math.round(modalZepa?.areaha || 0).toLocaleString()} ha
                  </div>
                  {modalZepa?.marine_area_percentage ? (
                    <div style={{ fontSize: '11px', color: '#3b82f6' }}>
                      {modalZepa.marine_area_percentage}% Área marina
                    </div>
                  ) : null}
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: colors.textSecondary }}>FECHA DECLARACIÓN</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '2px' }}>
                    {modalZepa?.date_spa ? modalZepa.date_spa.split('T')[0] : 'No registrada'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: colors.textSecondary }}>COORDENADAS</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px' }}>
                    {modalZepa?.latitude?.toFixed(4)}°, {modalZepa?.longitude?.toFixed(4)}°
                  </div>
                  {modalZepa?.latitude && modalZepa?.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${modalZepa.latitude},${modalZepa.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        color: '#10b981',
                        marginTop: '3px',
                        textDecoration: 'none',
                      }}
                    >
                      <MapPin size={11} />
                      Abrir en mapa <ExternalLink size={10} />
                    </a>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: colors.textSecondary }}>ACTUALIZACIÓN OFICIAL</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px' }}>
                    {modalZepa?.date_update ? modalZepa.date_update.split('T')[0] : 'Diciembre 2024'}
                  </div>
                  {modalZepa?.sitecode && (
                    <a
                      href={`https://natura2000.eea.europa.eu/Natura2000/sdf/#/sdf?site=${encodeURIComponent(modalZepa.sitecode)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        color: '#3b82f6',
                        marginTop: '3px',
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                      title={`Abrir Formulario Normalizado de Datos (SDF) oficial de la UE para ${modalZepa.sitecode}`}
                    >
                      <ExternalLink size={11} />
                      Ficha SDF oficial
                    </a>
                  )}
                </div>
              </div>

              {/* Referencia Legal */}
              {modalZepa?.spa_legal_reference && (
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#3b82f6', marginBottom: '4px' }}>
                    <FileText size={14} />
                    Disposición Legal Reguladora
                  </div>
                  <div style={{ fontSize: '13px', color: colors.textPrimary, lineHeight: 1.4 }}>
                    {modalZepa.spa_legal_reference}
                  </div>
                </div>
              )}

              {/* Descripción / Calidad del Espacio si existe */}
              {modalZepa?.quality && (
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 6px 0', color: colors.textPrimary }}>
                    Calidad e Importancia Ornitológica
                  </h3>
                  <div
                    style={{
                      fontSize: '13px',
                      color: colors.textSecondary,
                      lineHeight: 1.5,
                      backgroundColor: inputBg,
                      padding: '14px',
                      borderRadius: '10px',
                      border: `1px solid ${colors.cardBorder}`,
                      maxHeight: '160px',
                      overflowY: 'auto',
                    }}
                  >
                    {modalZepa.quality}
                  </div>
                </div>
              )}

              {/* Sección de Especies de Aves Censadas */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bird size={18} color="#10b981" />
                    <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: colors.textPrimary }}>
                      Aves Censadas en esta ZEPA ({modalSpecies.length} especies catalogadas)
                    </h3>
                  </div>

                  {modalSpecies.length > 5 && (
                    <div style={{ position: 'relative', width: '220px' }}>
                      <Search
                        size={14}
                        style={{
                          position: 'absolute',
                          left: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: colors.textSecondary,
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Filtrar ave..."
                        value={speciesSearch}
                        onChange={(e) => setSpeciesSearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 10px 6px 30px',
                          backgroundColor: inputBg,
                          color: colors.textPrimary,
                          border: `1px solid ${colors.cardBorder}`,
                          borderRadius: '8px',
                          fontSize: '12px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  )}
                </div>

                {modalLoading ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: colors.textSecondary }}>
                    <RefreshCw size={20} className="spin" style={{ display: 'inline', marginRight: '8px' }} />
                    Cargando censo oficial de aves...
                  </div>
                ) : filteredModalSpecies.length === 0 ? (
                  <div
                    style={{
                      padding: '24px',
                      textAlign: 'center',
                      color: colors.textSecondary,
                      backgroundColor: inputBg,
                      borderRadius: '10px',
                      fontSize: '13px',
                    }}
                  >
                    {speciesSearch
                      ? `No se encontró ninguna especie con el término "${speciesSearch}"`
                      : 'No hay especies de aves registradas en el banco oficial para este espacio.'}
                  </div>
                ) : (
                  <div
                    style={{
                      maxHeight: '320px',
                      overflowY: 'auto',
                      borderRadius: '10px',
                      border: `1px solid ${colors.cardBorder}`,
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderBottom: `1px solid ${colors.cardBorder}` }}>
                          <th style={{ padding: '10px 14px', fontWeight: 700, color: colors.textSecondary }}>
                            Nombre Científico
                          </th>
                          <th style={{ padding: '10px 14px', fontWeight: 700, color: colors.textSecondary }}>
                            Código Directiva
                          </th>
                          <th style={{ padding: '10px 14px', fontWeight: 700, color: colors.textSecondary }}>
                            Población / Tipo
                          </th>
                          <th style={{ padding: '10px 14px', fontWeight: 700, color: colors.textSecondary, textAlign: 'right' }}>
                            Conteo Oficial
                          </th>
                          <th style={{ padding: '10px 14px', fontWeight: 700, color: colors.textSecondary, textAlign: 'center' }}>
                            Abundancia
                          </th>
                          <th style={{ padding: '10px 14px', fontWeight: 700, color: colors.textSecondary, textAlign: 'center' }}>
                            Conservación
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredModalSpecies.map((sp, idx) => (
                          <tr
                            key={`${sp.speciescode}-${idx}`}
                            style={{
                              borderBottom: `1px solid ${colors.cardBorder}`,
                              transition: 'background-color 0.15s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = cardHover)}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <td style={{ padding: '10px 14px', fontWeight: 700, fontStyle: 'italic', color: colors.textPrimary }}>
                              {sp.speciesname}
                            </td>
                            <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#10b981', fontWeight: 600 }}>
                              {sp.speciescode}
                            </td>
                            <td style={{ padding: '10px 14px', color: colors.textSecondary }}>
                              {getPopulationTypeLabel(sp.population_type)}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600 }}>
                              {sp.lowerbound !== null && sp.upperbound !== null
                                ? `${sp.lowerbound.toLocaleString()} - ${sp.upperbound.toLocaleString()} ${sp.counting_unit || 'ind.'}`
                                : sp.lowerbound !== null
                                ? `${sp.lowerbound.toLocaleString()} ${sp.counting_unit || 'ind.'}`
                                : '-'}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                              {sp.abundance_category ? (
                                <span
                                  style={{
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                    color: '#3b82f6',
                                  }}
                                  title={`Categoría de abundancia: ${sp.abundance_category}`}
                                >
                                  {sp.abundance_category}
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                              {sp.conservation ? (
                                <span
                                  style={{
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    backgroundColor:
                                      sp.conservation === 'A'
                                        ? 'rgba(16, 185, 129, 0.15)'
                                        : 'rgba(245, 158, 11, 0.15)',
                                    color: sp.conservation === 'A' ? '#10b981' : '#f59e0b',
                                  }}
                                  title={`Estado de conservación evaluado: Grado ${sp.conservation}`}
                                >
                                  {sp.conservation}
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Pie del modal */}
            <div
              style={{
                padding: '14px 24px',
                borderTop: `1px solid ${colors.cardBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                backgroundColor: 'rgba(0,0,0,0.02)',
              }}
            >
              <button
                onClick={closeModal}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  backgroundColor: inputBg,
                  color: colors.textPrimary,
                  border: `1px solid ${colors.cardBorder}`,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL DE AYUDA Y LEYENDA DE CÓDIGOS OFICIALES */}
      {showHelpModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setShowHelpModal(false)}
        >
          <div
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: '20px',
              border: `1px solid ${colors.cardBorder}`,
              width: '100%',
              maxWidth: '860px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Modal de Ayuda */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: `1px solid ${colors.cardBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(37, 99, 235, 0.12)',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BookOpen size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: colors.textPrimary }}>
                    Guía y Leyenda de Códigos Oficiales
                  </h2>
                  <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: colors.textSecondary }}>
                    Directiva Aves 2009/147/CE · Red Natura 2000 · Banco de Datos de la Naturaleza (MITECO)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowHelpModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.textSecondary,
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '8px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido explicativo con scroll */}
            <div style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Sección 1: Tipo de Espacio ZEPA */}
              <div
                style={{
                  backgroundColor: inputBg,
                  padding: '18px 20px',
                  borderRadius: '14px',
                  border: `1px solid ${colors.cardBorder}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <ShieldCheck size={18} color="#10b981" />
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: colors.textPrimary }}>
                    1. Clasificación del Espacio (Tipo ZEPA)
                  </h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 800,
                          backgroundColor: '#10b981',
                          color: '#ffffff',
                        }}
                      >
                        Tipo A
                      </span>
                      <strong style={{ fontSize: '13px', color: colors.textPrimary }}>ZEPA Exclusiva</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '12.5px', color: colors.textSecondary, lineHeight: 1.45 }}>
                      Espacio declarado <strong>exclusivamente como Zona de Especial Protección para las Aves (ZEPA)</strong> en virtud del artículo 4 de la Directiva Aves. No coincide en límites ni comparte declaración con un Lugar de Importancia Comunitaria (LIC). En España existen <strong>387 ZEPAs Tipo A</strong>.
                    </p>
                  </div>

                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 800,
                          backgroundColor: '#3b82f6',
                          color: '#ffffff',
                        }}
                      >
                        Tipo C
                      </span>
                      <strong style={{ fontSize: '13px', color: colors.textPrimary }}>ZEPA coincidente con LIC/ZEC</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '12.5px', color: colors.textSecondary, lineHeight: 1.45 }}>
                      Espacio donde <strong>coinciden territorialmente una ZEPA</strong> (Directiva Aves) y un <strong>Lugar de Importancia Comunitaria (LIC) / ZEC</strong> (Directiva Hábitats). Comparte régimen de protección conjunto. En España existen <strong>271 ZEPAs Tipo C</strong>.
                    </p>
                  </div>
                </div>
                <div style={{ marginTop: '10px', fontSize: '11.5px', color: colors.textSecondary, fontStyle: 'italic' }}>
                  * Nota: Los sitios Tipo B corresponden a LICs puros de la Directiva Hábitats (sin condición de ZEPA) y han sido excluidos de esta aplicación por no ser materia ornitológica.
                </div>
              </div>

              {/* Sección 2: Población / Tipo de Presencia */}
              <div
                style={{
                  backgroundColor: inputBg,
                  padding: '18px 20px',
                  borderRadius: '14px',
                  border: `1px solid ${colors.cardBorder}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Bird size={18} color="#0284c7" />
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: colors.textPrimary }}>
                    2. Tipo de Población o Presencia de las Aves (Columna "Población / Tipo")
                  </h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ padding: '2px 7px', borderRadius: '4px', fontSize: '12px', fontWeight: 800, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontFamily: 'monospace' }}>p</span>
                      <strong style={{ fontSize: '13px' }}>Residente</strong>
                    </div>
                    <div style={{ fontSize: '12px', color: colors.textSecondary, lineHeight: 1.4 }}>
                      Población <strong>sedentaria y permanente</strong> presente de forma regular a lo largo de todo el año.
                    </div>
                  </div>

                  <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ padding: '2px 7px', borderRadius: '4px', fontSize: '12px', fontWeight: 800, backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', fontFamily: 'monospace' }}>r</span>
                      <strong style={{ fontSize: '13px' }}>Reproductora</strong>
                    </div>
                    <div style={{ fontSize: '12px', color: colors.textSecondary, lineHeight: 1.4 }}>
                      Población que utiliza la ZEPA como <strong>área de cortejo, nidificación y cría</strong> (primavera/verano).
                    </div>
                  </div>

                  <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ padding: '2px 7px', borderRadius: '4px', fontSize: '12px', fontWeight: 800, backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#0891b2', fontFamily: 'monospace' }}>w</span>
                      <strong style={{ fontSize: '13px' }}>Invernante</strong>
                    </div>
                    <div style={{ fontSize: '12px', color: colors.textSecondary, lineHeight: 1.4 }}>
                      Aves que pasan la época no reproductora <strong>(otoño e invierno)</strong> en el espacio.
                    </div>
                  </div>

                  <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ padding: '2px 7px', borderRadius: '4px', fontSize: '12px', fontWeight: 800, backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontFamily: 'monospace' }}>c</span>
                      <strong style={{ fontSize: '13px' }}>Paso / Concentración</strong>
                    </div>
                    <div style={{ fontSize: '12px', color: colors.textSecondary, lineHeight: 1.4 }}>
                      Área de <strong>descanso o escala migratoria</strong> prenupcial/postnupcial o congregación para muda.
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección 3: Conteo Oficial y Unidades */}
              <div
                style={{
                  backgroundColor: inputBg,
                  padding: '18px 20px',
                  borderRadius: '14px',
                  border: `1px solid ${colors.cardBorder}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <FileText size={18} color="#a855f7" />
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: colors.textPrimary }}>
                    3. Conteo Poblacional Oficial y Unidades de Censo
                  </h3>
                </div>
                <p style={{ margin: '0 0 10px 0', fontSize: '12.5px', color: colors.textSecondary, lineHeight: 1.45 }}>
                  Indica los límites inferior y superior (rango mínimo - máximo) de individuos o parejas censados en el Formulario Normalizado de Datos de la Unión Europea (SDF).
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                    <strong style={{ fontSize: '12.5px', color: '#a855f7' }}>p / pairs</strong>
                    <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
                      Parejas reproductoras contabilizadas activas.
                    </div>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                    <strong style={{ fontSize: '12.5px', color: '#a855f7' }}>i / individuals</strong>
                    <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
                      Número de individuos o ejemplares censados.
                    </div>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                    <strong style={{ fontSize: '12.5px', color: '#a855f7' }}>calling males</strong>
                    <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
                      Machos territoriales detectados por canto.
                    </div>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                    <strong style={{ fontSize: '12.5px', color: '#a855f7' }}>colonies</strong>
                    <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
                      Número de colonias de cría activas.
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección 4: Categoría de Abundancia */}
              <div
                style={{
                  backgroundColor: inputBg,
                  padding: '18px 20px',
                  borderRadius: '14px',
                  border: `1px solid ${colors.cardBorder}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Layers size={18} color="#3b82f6" />
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: colors.textPrimary }}>
                    4. Categoría de Abundancia Relativa
                  </h3>
                </div>
                <p style={{ margin: '0 0 10px 0', fontSize: '12.5px', color: colors.textSecondary, lineHeight: 1.45 }}>
                  Se emplea cuando no se dispone de un conteo numérico exacto en el momento del censo:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                    <span style={{ padding: '1px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 800, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', marginRight: '6px' }}>C</span>
                    <strong style={{ fontSize: '12.5px' }}>Común (Common)</strong>
                    <div style={{ fontSize: '11.5px', color: colors.textSecondary, marginTop: '3px' }}>
                      Presencia frecuente y densidades medias o altas en hábitats idóneos.
                    </div>
                  </div>

                  <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                    <span style={{ padding: '1px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 800, backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', marginRight: '6px' }}>R</span>
                    <strong style={{ fontSize: '12.5px' }}>Rara (Rare)</strong>
                    <div style={{ fontSize: '11.5px', color: colors.textSecondary, marginTop: '3px' }}>
                      Población reducida o baja frecuencia de avistamiento en el espacio.
                    </div>
                  </div>

                  <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                    <span style={{ padding: '1px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 800, backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', marginRight: '6px' }}>V</span>
                    <strong style={{ fontSize: '12.5px' }}>Muy Rara (Very rare)</strong>
                    <div style={{ fontSize: '11.5px', color: colors.textSecondary, marginTop: '3px' }}>
                      Presencia accidental, citas excepcionales o muy escasas.
                    </div>
                  </div>

                  <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                    <span style={{ padding: '1px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 800, backgroundColor: 'rgba(148, 163, 184, 0.2)', color: colors.textSecondary, marginRight: '6px' }}>P</span>
                    <strong style={{ fontSize: '12.5px' }}>Presente (Present)</strong>
                    <div style={{ fontSize: '11.5px', color: colors.textSecondary, marginTop: '3px' }}>
                      Presencia confirmada fehacientemente pero sin estimación cuantitativa.
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección 5: Estado de Conservación y Calidad */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '14px',
                }}
              >
                {/* Conservación */}
                <div
                  style={{
                    backgroundColor: inputBg,
                    padding: '16px 18px',
                    borderRadius: '14px',
                    border: `1px solid ${colors.cardBorder}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <CheckCircle2 size={16} color="#10b981" />
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: colors.textPrimary }}>
                      5. Grado de Conservación
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ padding: '2px 7px', borderRadius: '4px', fontSize: '11px', fontWeight: 800, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>A</span>
                      <div><strong>Excelente:</strong> Población óptima y hábitat en excelente estado funcional.</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ padding: '2px 7px', borderRadius: '4px', fontSize: '11px', fontWeight: 800, backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>B</span>
                      <div><strong>Buena:</strong> Población bien conservada con presiones o amenazas moderadas.</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ padding: '2px 7px', borderRadius: '4px', fontSize: '11px', fontWeight: 800, backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>C</span>
                      <div><strong>Media / Reducida:</strong> Estado desfavorable que requiere planes de recuperación.</div>
                    </div>
                  </div>
                </div>

                {/* Calidad de Datos */}
                <div
                  style={{
                    backgroundColor: inputBg,
                    padding: '16px 18px',
                    borderRadius: '14px',
                    border: `1px solid ${colors.cardBorder}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <Calendar size={16} color="#0284c7" />
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: colors.textPrimary }}>
                      6. Calidad de los Datos
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                    <div><strong>G (Buena):</strong> Basada en censos sistemáticos recientes y metodología normalizada.</div>
                    <div><strong>M (Moderada):</strong> Basada en estimaciones parciales o muestreos incompletos.</div>
                    <div><strong>P (Pobre):</strong> Basada solo en estimaciones bibliográficas u opiniones de expertos.</div>
                    <div><strong>DD (Deficiente):</strong> Sin datos suficientes para contrastar la fiabilidad.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pie del Modal */}
            <div
              style={{
                padding: '14px 24px',
                borderTop: `1px solid ${colors.cardBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                backgroundColor: 'rgba(0,0,0,0.02)',
              }}
            >
              <button
                onClick={() => setShowHelpModal(false)}
                style={{
                  padding: '9px 22px',
                  borderRadius: '10px',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                }}
              >
                Entendido / Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
