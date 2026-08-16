import os
import sys
import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import folium
from streamlit_folium import st_folium
from datetime import datetime, timedelta

# Add project root to python path to resolve models imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Import modeling modules
from models.aqi_model import AQIModelManager, calculate_cpcb_aqi
from models.hotspot_detection import HotspotDetector
from models.transport_model import WindTransportModel
from models.source_attribution import SourceAttributor
from models.explainability import AQIExplainer

# Page configuration
st.set_page_config(
    page_title="VayuDrishti — AI Air Quality Intelligence",
    page_icon="🛰️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Advanced Mockup CSS Injection (1-to-1 visual layout match)
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
    
    /* Global Background & Fonts */
    .stApp {
        background-color: #060913 !important;
        background: radial-gradient(circle at 50% 10%, #0c152b 0%, #05070e 100%) !important;
        color: #e6edf3;
        font-family: 'Outfit', 'Inter', sans-serif;
    }
    
    /* Sidebar Overrides */
    section[data-testid="stSidebar"] {
        background-color: #05070f !important;
        border-right: 1px solid #161b2c !important;
    }
    
    /* Sidebar Navigation Links */
    div.stRadio > div[role="radiogroup"] > label {
        background-color: transparent;
        border: none;
        padding: 8px 12px;
        border-radius: 8px;
        margin-bottom: 4px;
        transition: all 0.2s ease-in-out;
        color: #8b949e !important;
        cursor: pointer;
        width: 100%;
    }
    
    div.stRadio > div[role="radiogroup"] > label:hover {
        background-color: rgba(88, 166, 255, 0.08) !important;
        color: #58a6ff !important;
    }
    
    div.stRadio > div[role="radiogroup"] > label[data-checked="true"] {
        background-color: #16223f !important;
        border-left: 3px solid #58a6ff !important;
        color: #58a6ff !important;
        font-weight: 600;
    }

    /* Top Greeting Banner */
    .greeting-title {
        font-size: 1.8rem;
        font-weight: 700;
        color: #ffffff;
        margin-bottom: 2px;
    }
    
    .greeting-subtitle {
        font-size: 0.9rem;
        color: #8b949e;
        margin-bottom: 20px;
    }
    
    /* KPI Cards Layout */
    .kpi-container {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 12px;
        margin-bottom: 20px;
    }
    
    .kpi-card {
        background: rgba(13, 20, 38, 0.6);
        border: 1px solid #1f2d4d;
        border-radius: 12px;
        padding: 16px;
        position: relative;
        overflow: hidden;
        transition: all 0.3s ease;
    }
    
    .kpi-card:hover {
        transform: translateY(-3px);
        border-color: #38568c;
        box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    }
    
    .kpi-title {
        font-size: 0.75rem;
        text-transform: uppercase;
        color: #8b949e;
        margin-bottom: 2px;
        letter-spacing: 0.5px;
    }
    
    .kpi-subtitle {
        font-size: 0.7rem;
        color: #526385;
        margin-bottom: 8px;
    }
    
    .kpi-value {
        font-size: 1.8rem;
        font-weight: 700;
        line-height: 1.1;
    }
    
    .kpi-status {
        font-size: 0.75rem;
        font-weight: 600;
        margin-top: 4px;
        margin-bottom: 8px;
    }
    
    /* Glass Panel Layouts */
    .glass-panel {
        background: rgba(10, 15, 30, 0.75);
        border: 1px solid #1b2640;
        border-radius: 14px;
        padding: 20px;
        margin-bottom: 20px;
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
    }
    
    .panel-header {
        font-size: 1rem;
        font-weight: 600;
        color: #ffffff;
        margin-bottom: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    /* Progress Bars for Pollutants */
    .pollutant-row {
        margin-bottom: 10px;
    }
    
    .pollutant-labels {
        display: flex;
        justify-content: space-between;
        font-size: 0.8rem;
        margin-bottom: 3px;
        color: #c9d1d9;
    }
    
    .progress-bar-bg {
        background-color: #172033;
        height: 6px;
        border-radius: 3px;
        width: 100%;
        overflow: hidden;
    }
    
    .progress-bar-fill {
        height: 100%;
        border-radius: 3px;
    }
    
    /* Bottom Cards visual animations */
    .bottom-card-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 12px;
        margin-top: 10px;
    }
    
    .bottom-card {
        background: rgba(10, 16, 31, 0.8);
        border: 1px solid #1c2a47;
        border-radius: 12px;
        padding: 16px;
        height: 160px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        position: relative;
        overflow: hidden;
    }
    
    .bottom-card:hover {
        border-color: #38568c;
    }
    
    /* Rotating Radar Animation */
    .radar-container {
        position: absolute;
        right: 10px;
        bottom: 10px;
        width: 60px;
        height: 60px;
        border: 1px solid rgba(188, 140, 255, 0.15);
        border-radius: 50%;
        overflow: hidden;
    }
    .radar-sweep {
        position: absolute;
        width: 100%;
        height: 100%;
        background: conic-gradient(from 0deg, rgba(188, 140, 255, 0.15) 0deg, rgba(188, 140, 255, 0) 90deg);
        animation: spin 3s linear infinite;
        transform-origin: center;
    }
    
    /* Flowing wind wave animation */
    .wave-container {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 40px;
        opacity: 0.3;
        overflow: hidden;
    }
    .wave-line {
        position: absolute;
        width: 200%;
        height: 100%;
        background-image: repeating-linear-gradient(90deg, transparent, transparent 15px, #29b6f6 15px, #29b6f6 30px);
        animation: waveFlow 4s linear infinite;
    }
    
    /* Fire Glow animation */
    .fire-glow {
        position: absolute;
        right: 15px;
        bottom: 15px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #ff5722;
        box-shadow: 0 0 15px 5px rgba(255, 87, 34, 0.5);
        animation: glowPulse 1.5s infinite alternate;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    @keyframes waveFlow {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
    }
    
    @keyframes glowPulse {
        0% { transform: scale(0.9); box-shadow: 0 0 10px 2px rgba(255, 87, 34, 0.4); }
        100% { transform: scale(1.2); box-shadow: 0 0 20px 8px rgba(255, 87, 34, 0.6); }
    }
    
    /* Scale colorbar style */
    .scale-bar {
        background: linear-gradient(90deg, #00b050 0%, #92d050 20%, #ffff00 40%, #ffc000 60%, #ff0000 80%, #c00000 100%);
        height: 10px;
        border-radius: 5px;
        margin-top: 10px;
        width: 100%;
    }
</style>
""", unsafe_allow_html=True)

# Helper function to generate SVG Sparklines
def generate_sparkline_svg(values, color="#ffd54f"):
    if values is None or len(values) < 2:
        return ""
    min_v, max_v = min(values), max(values)
    v_range = max_v - min_v if max_v != min_v else 1.0
    w, h = 100, 25
    points = []
    for idx, v in enumerate(values):
        x = (idx / (len(values) - 1)) * w
        y = h - ((v - min_v) / v_range) * h
        points.append(f"{x},{y}")
    points_str = " ".join(points)
    return f'<svg width="100%" height="{h}" viewBox="0 0 {w} {h}"><polyline fill="none" stroke="{color}" stroke-width="1.8" points="{points_str}"/></svg>'

# Helper function to get CPCB category color and label
def get_cpcb_color_and_label(aqi):
    if aqi <= 50:
        return "#00b050", "Good"
    elif aqi <= 100:
        return "#92d050", "Satisfactory"
    elif aqi <= 200:
        return "#ffff00", "Moderate"
    elif aqi <= 300:
        return "#ffc000", "Poor"
    elif aqi <= 400:
        return "#ff0000", "Very Poor"
    else:
        return "#c00000", "Severe"

# Load Datasets
@st.cache_data
def load_app_datasets():
    grid = pd.read_csv("data/grid_data.csv")
    fires = pd.read_csv("data/fire_events.csv")
    return grid, fires

@st.cache_resource
def load_modeling_pipeline():
    manager = AQIModelManager()
    manager.load_models()
    explainer = AQIExplainer(manager)
    explainer.initialize_explainers()
    attributor = SourceAttributor()
    transport = WindTransportModel()
    return manager, explainer, attributor, transport

try:
    grid_df_raw, fires_df = load_app_datasets()
    model_manager, explainer, attributor, transport = load_modeling_pipeline()
except Exception as e:
    st.error(f"Error loading system files: {e}. Confirm verify_models.py has completed successfully.")
    st.stop()

# Run predictions on load
@st.cache_data
def compute_predicted_grid(_manager, _attributor, df):
    pred_df = _manager.predict_grid(df)
    attributed_df = _attributor.attribute_dataframe(pred_df)
    return attributed_df

grid_df = compute_predicted_grid(model_manager, attributor, grid_df_raw)

# ==================== LEFT SIDEBAR NAVIGATION ====================
# Branding
st.sidebar.markdown("""
<div style='display: flex; align-items: center; margin-bottom: 20px;'>
    <div style='font-size: 2.2rem; margin-right: 10px;'>🛰️</div>
    <div>
        <div style='font-size: 1.35rem; font-weight: 800; color: #58a6ff; line-height:1.1;'>VayuDrishti</div>
        <div style='font-size: 0.7rem; color: #8b949e; letter-spacing:0.5px;'>AI Air Quality Intelligence</div>
    </div>
</div>
""", unsafe_allow_html=True)

# Navigation Radio styled via CSS
nav_page = st.sidebar.radio(
    "Navigation Menu",
    [
        "📊 Dashboard",
        "🗺️ Live Map",
        "🔮 AQI Forecast",
        "🧬 HCHO Hotspots",
        "🔥 Fire Detection",
        "💨 Wind Transport",
        "🏷️ Source Attribution",
        "🏙️ District Analytics",
        "📋 Reports",
        "🔔 Alerts",
        "🗂️ Data Explorer",
        "⚙️ Settings"
    ],
    label_visibility="collapsed"
)

# Bottom Sidebar Card: Data Updated
st.sidebar.markdown("""
<div style='position: fixed; bottom: 20px; left: 20px; width: 200px; background-color: #0b101f; border: 1px solid #1f2d4d; border-radius: 8px; padding: 12px; font-size: 0.75rem;'>
    <div style='color: #8b949e; display: flex; align-items: center; gap: 6px;'>
        <div style='width: 8px; height: 8px; background-color: #00e676; border-radius: 50%; box-shadow: 0 0 8px #00e676;'></div>
        Data Updated
    </div>
    <div style='font-weight: bold; color: #ffffff; margin-top: 4px;'>5 mins ago</div>
    <div style='color: #526385; margin-top: 2px;'>2025-11-05 14:30 IST</div>
</div>
""", unsafe_allow_html=True)


# Global State Management
if "selected_date" not in st.session_state:
    st.session_state.selected_date = "2025-11-05"
if "selected_district" not in st.session_state:
    st.session_state.selected_district = "Ambala"

selected_date = st.session_state.selected_date
selected_district = st.session_state.selected_district

# Sidebar Filters (displayed when not on Dashboard page)
if nav_page != "📊 Dashboard":
    st.sidebar.markdown("---")
    st.sidebar.markdown("### 🎛&nbsp; PAGE FILTERS")
    all_dates = sorted(grid_df["date"].unique())
    default_date_idx = all_dates.index(st.session_state.selected_date) if st.session_state.selected_date in all_dates else 0
    new_date = st.sidebar.selectbox("📅 Date Filter", all_dates, index=default_date_idx)
    if new_date != st.session_state.selected_date:
        st.session_state.selected_date = new_date
        st.rerun()
        
    all_districts = sorted(grid_df["district"].unique())
    default_district_idx = all_districts.index(st.session_state.selected_district) if st.session_state.selected_district in all_districts else 0
    new_district = st.sidebar.selectbox("🏙️ District Filter", all_districts, index=default_district_idx)
    if new_district != st.session_state.selected_district:
        st.session_state.selected_district = new_district
        st.rerun()

# Get observations for target date
day_df = grid_df[grid_df["date"] == selected_date]
day_fires = fires_df[fires_df["date"] == selected_date]
district_day_df = day_df[day_df["district"] == selected_district]

if not district_day_df.empty:
    focus_lat = district_day_df["latitude"].mean()
    focus_lon = district_day_df["longitude"].mean()
    district_data = district_day_df.iloc[0]
else:
    focus_lat, focus_lon = 28.6139, 77.2090
    district_data = None

# Default values for Delhi (Top KPI Cards Reference)
delhi_day_df = day_df[day_df["district"] == "Delhi"]
delhi_data = delhi_day_df.iloc[0] if not delhi_day_df.empty else None

# Pre-detect hotspots globally
hotspot_detector = HotspotDetector(eps_deg=0.3, min_samples=2, hcho_percentile=85)
day_hotspots = hotspot_detector.detect_hotspots(day_df, fires_df)


# ==================== PAGE: DASHBOARD ====================
if nav_page == "📊 Dashboard":
    
    # 1. Top Bar: Greeting & Controls
    col_g1, col_g2 = st.columns([1.2, 0.8])
    with col_g1:
        st.markdown("<h2 class='greeting-title'>Good Afternoon, Team VayuDrishti 👋</h2>", unsafe_allow_html=True)
        st.markdown("<p class='greeting-subtitle'>Real-time Air Quality Intelligence Powered by Satellite & AI</p>", unsafe_allow_html=True)
    with col_g2:
        c_c1, c_c2 = st.columns([0.6, 0.4])
        with c_c1:
            all_dates = sorted(grid_df["date"].unique())
            default_date_idx = all_dates.index(st.session_state.selected_date) if st.session_state.selected_date in all_dates else 0
            new_date = st.selectbox("Observation Date", all_dates, index=default_date_idx, label_visibility="collapsed")
            if new_date != st.session_state.selected_date:
                st.session_state.selected_date = new_date
                st.rerun()
        with c_c2:
            st.button("Export Report 📥", use_container_width=True)

    # 2. Top Row: 6 KPI Cards with Sparklines
    # Compute 7-day sparklines for Delhi
    delhi_7d_df = grid_df[
        (grid_df["district"] == "Delhi") & 
        (grid_df["date"] <= selected_date)
    ].sort_values("date").tail(7)
    
    spark_aqi = delhi_7d_df["aqi"].values if not delhi_7d_df.empty else [100]*7
    spark_pm25 = delhi_7d_df["pm25"].values if not delhi_7d_df.empty else [50]*7
    spark_pm10 = delhi_7d_df["pm10"].values if not delhi_7d_df.empty else [120]*7
    spark_hcho = delhi_7d_df["hcho_column"].values if not delhi_7d_df.empty else [1.5]*7
    
    # Sparkline mockups for fires and wind
    spark_fires = [45, 60, 85, 127, 95, 110, 127]
    spark_wind = [12, 15, 18, 14, 16, 18, 18]

    # Render HTML KPI container
    k_aqi, k_pm25, k_pm10, k_hcho, k_fire, k_wind = st.columns(6)
    
    # Card 1: Estimated AQI
    color, label = get_cpcb_color_and_label(158)
    with k_aqi:
        st.markdown(f"""
        <div class='kpi-card'>
            <div class='kpi-title'>Estimated AQI</div>
            <div class='kpi-subtitle'>Delhi, Delhi</div>
            <div class='kpi-value' style='color: {color};'>158</div>
            <div class='kpi-status' style='color: {color};'>{label}</div>
            {generate_sparkline_svg(spark_aqi, color)}
            <div style='font-size: 0.6rem; color: #526385; margin-top: 5px;'>Updated 10 mins ago</div>
        </div>
        """, unsafe_allow_html=True)
        
    # Card 2: PM2.5
    color, label = get_cpcb_color_and_label(77)
    with k_pm25:
        st.markdown(f"""
        <div class='kpi-card'>
            <div class='kpi-title'>PM2.5</div>
            <div class='kpi-subtitle'>µg/m³</div>
            <div class='kpi-value' style='color: #ffd54f;'>77</div>
            <div class='kpi-status' style='color: #ffd54f;'>Moderate</div>
            {generate_sparkline_svg(spark_pm25, "#ffd54f")}
        </div>
        """, unsafe_allow_html=True)
        
    # Card 3: PM10
    with k_pm10:
        st.markdown(f"""
        <div class='kpi-card'>
            <div class='kpi-title'>PM10</div>
            <div class='kpi-subtitle'>µg/m³</div>
            <div class='kpi-value' style='color: #ff9100;'>143</div>
            <div class='kpi-status' style='color: #ff9100;'>Unhealthy for Sensitive</div>
            {generate_sparkline_svg(spark_pm10, "#ff9100")}
        </div>
        """, unsafe_allow_html=True)
        
    # Card 4: HCHO Hotspots
    with k_hcho:
        st.markdown(f"""
        <div class='kpi-card'>
            <div class='kpi-title'>HCHO Hotspots</div>
            <div class='kpi-subtitle'>Active</div>
            <div class='kpi-value' style='color: #ff1744;'>24</div>
            <div class='kpi-status' style='color: #ff1744;'>High</div>
            {generate_sparkline_svg(spark_hcho, "#ff1744")}
        </div>
        """, unsafe_allow_html=True)
        
    # Card 5: Active Fires
    with k_fire:
        st.markdown(f"""
        <div class='kpi-card'>
            <div class='kpi-title'>Active Fires</div>
            <div class='kpi-subtitle'>Detected</div>
            <div class='kpi-value' style='color: #ff1744;'>127</div>
            <div class='kpi-status' style='color: #ff1744;'>High</div>
            {generate_sparkline_svg(spark_fires, "#ff1744")}
        </div>
        """, unsafe_allow_html=True)
        
    # Card 6: Wind Speed
    with k_wind:
        st.markdown(f"""
        <div class='kpi-card'>
            <div class='kpi-title'>Wind Speed</div>
            <div class='kpi-subtitle'>km/h</div>
            <div class='kpi-value' style='color: #00e676;'>18</div>
            <div class='kpi-status' style='color: #00e676;'>Moderate</div>
            {generate_sparkline_svg(spark_wind, "#00e676")}
        </div>
        """, unsafe_allow_html=True)

    # 3. Middle Row: Map Panel & Right Metrics Sidebar
    col_map_body, col_focus_sidebar = st.columns([1.1, 0.9])
    
    with col_map_body:
        st.markdown("""
        <div style='display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;'>
            <div style='font-size: 1rem; font-weight: 600; color: #ffffff;'>Real-time Air Quality & Atmospheric Overview</div>
            <div style='font-size: 0.75rem; color: #8b949e;'>Satellite derived · Real-time · India</div>
        </div>
        """, unsafe_allow_html=True)
        
        # Horizontal Pollutant Toggles
        pollutant_toggles = ["AQI", "PM2.5", "PM10", "HCHO", "NO₂", "SO₂", "CO", "O₃"]
        sel_pollutant = st.segmented_control("Select layer:", pollutant_toggles, default="AQI", label_visibility="collapsed")
        
        # Map Container
        # We will use CartoDB darkmatter to match the dark theme and glow effects of the mockup map
        m_dash = folium.Map(location=[30.1, 75.8], zoom_start=8, tiles="cartodbdarkmatter")
        
        # Add toggleable Layers
        # Render AQI heat cells
        for idx, r in day_df.iterrows():
            aqi_val = r["aqi"]
            color, cat = get_cpcb_color_and_label(aqi_val)
            
            folium.CircleMarker(
                location=[r["latitude"], r["longitude"]],
                radius=10,
                color=color,
                fill=True,
                fill_color=color,
                fill_opacity=0.55,
                stroke=False,
                popup=folium.Popup(f"AQI: {aqi_val} ({cat})")
            ).add_to(m_dash)
            
        # Draw DBSCAN HCHO hotspots
        for idx, r in day_hotspots[day_hotspots["is_hotspot"]].iterrows():
            folium.Circle(
                location=[r["latitude"], r["longitude"]],
                radius=8000,
                color="#bc8cff",
                weight=1,
                fill=True,
                fill_color="#bc8cff",
                fill_opacity=0.2,
                popup="HCHO Hotspot"
            ).add_to(m_dash)
            
        # Draw active fires
        for idx, fire in day_fires.iterrows():
            folium.CircleMarker(
                location=[fire["latitude"], fire["longitude"]],
                radius=5,
                color="#ff3d00",
                fill=True,
                fill_color="#ffea00",
                fill_opacity=0.8,
                stroke=False
            ).add_to(m_dash)

        # Render map inside Streamlit
        st_folium(m_dash, width="100%", height=450, returned_objects=[])
        
        # Color Scale bar
        st.markdown("<div class='scale-bar'></div>", unsafe_allow_html=True)
        st.markdown("""
        <div style='display: flex; justify-content: space-between; font-size: 0.75rem; color: #8b949e; margin-top: 4px;'>
            <span>0</span>
            <span>50</span>
            <span>100</span>
            <span>150</span>
            <span>200</span>
            <span>300</span>
            <span>400</span>
            <span>500</span>
        </div>
        """, unsafe_allow_html=True)

    with col_focus_sidebar:
        # Focus District Dropdown Selector
        all_districts = sorted(grid_df["district"].unique())
        default_district_idx = all_districts.index(st.session_state.selected_district) if st.session_state.selected_district in all_districts else 0
        new_district = st.selectbox("Focus District Selector", all_districts, index=default_district_idx, key="focus_dist_drop", label_visibility="collapsed")
        if new_district != st.session_state.selected_district:
            st.session_state.selected_district = new_district
            st.rerun()
        
        # Get focus data
        dist_day = day_df[day_df["district"] == selected_district]
        dist_data = dist_day.iloc[0] if not dist_day.empty else None
        
        if dist_data is not None:
            dist_aqi = dist_data["aqi"]
            dist_color, dist_label = get_cpcb_color_and_label(dist_aqi)
            
            # 1. Semi-circular gauge chart (Plotly)
            fig_gauge = go.Figure(go.Indicator(
                mode = "gauge+number",
                value = dist_aqi,
                domain = {'x': [0, 1], 'y': [0, 1]},
                title = {'text': f"{selected_district} Estimated AQI", 'font': {'size': 14, 'color': '#8b949e'}},
                number = {'font': {'size': 36, 'color': dist_color}},
                gauge = {
                    'axis': {'range': [None, 500], 'tickwidth': 1, 'tickcolor': "#30363d"},
                    'bar': {'color': dist_color},
                    'bgcolor': "#161b2c",
                    'borderwidth': 2,
                    'bordercolor': "#30363d",
                    'steps': [
                        {'range': [0, 50], 'color': 'rgba(0, 176, 80, 0.2)'},
                        {'range': [51, 100], 'color': 'rgba(146, 208, 80, 0.2)'},
                        {'range': [101, 200], 'color': 'rgba(255, 255, 0, 0.2)'},
                        {'range': [201, 300], 'color': 'rgba(255, 192, 0, 0.2)'},
                        {'range': [301, 400], 'color': 'rgba(255, 0, 0, 0.2)'},
                        {'range': [401, 500], 'color': 'rgba(192, 0, 0, 0.2)'}
                    ],
                }
            ))
            fig_gauge.update_layout(
                paper_bgcolor="rgba(0,0,0,0)",
                font_color="#c9d1d9",
                height=150,
                margin=dict(l=20, r=20, t=30, b=0)
            )
            st.plotly_chart(fig_gauge, use_container_width=True)
            
            # 2. Pollutant concentrations lists with horizontal bars
            st.markdown("##### Pollutant Concentrations (µg/m³)")
            
            # List of pollutants
            pollutants = [
                {"name": "PM2.5", "value": dist_data["pm25"], "max_val": 250, "color": "#ffc000"},
                {"name": "PM10", "value": dist_data["pm10"], "max_val": 430, "color": "#ff9100"},
                {"name": "NO₂", "value": dist_data["no2_surface"], "max_val": 180, "color": "#00b050"},
                {"name": "SO₂", "value": dist_data["so2_surface"], "max_val": 380, "color": "#92d050"},
                {"name": "CO", "value": dist_data["co_surface"], "max_val": 10.0, "color": "#29b6f6"},
                {"name": "O₃", "value": dist_data["o3_surface"], "max_val": 168, "color": "#bc8cff"}
            ]
            
            for p in pollutants:
                pct = min(100.0, (p["value"] / p["max_val"]) * 100.0)
                st.markdown(f"""
                <div class='pollutant-row'>
                    <div class='pollutant-labels'>
                        <span><b>{p['name']}</b></span>
                        <span>{p['value']}</span>
                    </div>
                    <div class='progress-bar-bg'>
                        <div class='progress-bar-fill' style='width: {pct}%; background-color: {p['color']};'></div>
                    </div>
                </div>
                """, unsafe_allow_html=True)
                
            # 3. 7-Day Line Trend Chart
            st.markdown("##### Air Quality Trend (7 Days)")
            dist_7d = grid_df[
                (grid_df["district"] == selected_district) & 
                (grid_df["date"] <= selected_date)
            ].sort_values("date").tail(7)
            
            if not dist_7d.empty:
                fig_dist_trend = go.Figure()
                fig_dist_trend.add_trace(go.Scatter(x=dist_7d["date"], y=dist_7d["aqi"], name="AQI", line=dict(color="#58a6ff", width=2)))
                fig_dist_trend.add_trace(go.Scatter(x=dist_7d["date"], y=dist_7d["pm25"], name="PM2.5", line=dict(color="#ffd54f", width=2)))
                fig_dist_trend.add_trace(go.Scatter(x=dist_7d["date"], y=dist_7d["pm10"], name="PM10", line=dict(color="#ff9100", width=2)))
                fig_dist_trend.update_layout(
                    paper_bgcolor="rgba(0,0,0,0)",
                    plot_bgcolor="rgba(0,0,0,0)",
                    font_color="#8b949e",
                    height=160,
                    margin=dict(l=10, r=10, t=10, b=10),
                    xaxis=dict(showgrid=True, gridcolor="#1b2640"),
                    yaxis=dict(showgrid=True, gridcolor="#1b2640"),
                    legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
                )
                st.plotly_chart(fig_dist_trend, use_container_width=True)

    # 4. Bottom Row: 5 Cards with visual elements (Radar, fires, waves, donut)
    st.markdown("### 📊 Platform Core Status & Diagnostics")
    
    b_c1, b_c2, b_c3, b_c4, b_c5 = st.columns(5)
    
    # Card 1: HCHO Hotspots
    with b_c1:
        st.markdown(f"""
        <div class='bottom-card'>
            <div>
                <div class='kpi-title' style='color:#bc8cff;'>HCHO Hotspots</div>
                <div class='kpi-value' style='font-size: 2.2rem; color:#bc8cff;'>24 <span style='font-size:1rem; font-weight:normal;'>Active</span></div>
            </div>
            <div class='radar-container'>
                <div class='radar-sweep'></div>
            </div>
            <div style='font-size: 0.75rem; color:#8b949e;'>View Details →</div>
        </div>
        """, unsafe_allow_html=True)
        
    # Card 2: Fire Detection
    with b_c2:
        st.markdown(f"""
        <div class='bottom-card'>
            <div>
                <div class='kpi-title' style='color:#ff5722;'>Fire Detection</div>
                <div class='kpi-value' style='font-size: 2.2rem; color:#ff5722;'>127 <span style='font-size:1rem; font-weight:normal;'>Active</span></div>
            </div>
            <div class='fire-glow'></div>
            <div style='font-size: 0.75rem; color:#8b949e;'>View Details →</div>
        </div>
        """, unsafe_allow_html=True)
        
    # Card 3: Wind Transport
    with b_c3:
        st.markdown(f"""
        <div class='bottom-card'>
            <div>
                <div class='kpi-title' style='color:#29b6f6;'>Wind Transport</div>
                <div class='kpi-value' style='font-size: 1.5rem; color:#29b6f6; margin-top:10px;'>Active</div>
            </div>
            <div class='wave-container'>
                <div class='wave-line'></div>
            </div>
            <div style='font-size: 0.75rem; color:#8b949e;'>View Details →</div>
        </div>
        """, unsafe_allow_html=True)
        
    # Card 4: Source Attribution Donut Chart
    with b_c4:
        # Donut Chart for Source Attribution
        biomass = dist_data["source_biomass_pct"] if dist_data is not None else 58.0
        vehicular = dist_data["source_vehicular_pct"] if dist_data is not None else 28.0
        industrial = dist_data["source_industrial_pct"] if dist_data is not None else 14.0
        
        fig_donut = go.Figure(data=[go.Pie(
            labels=['Biomass', 'Vehicular', 'Industrial'],
            values=[biomass, vehicular, industrial],
            hole=.6,
            marker_colors=['#ff7043', '#29b6f6', '#b0bec5'],
            textinfo='none'
        )])
        fig_donut.update_layout(
            showlegend=False,
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            margin=dict(l=0, r=0, t=0, b=0),
            height=90,
            width=90
        )
        
        # Render Card with Donut Chart side by side
        col_c_left, col_c_right = st.columns([1.1, 0.9])
        with col_c_left:
            st.markdown(f"""
            <div style='display: flex; flex-direction: column; justify-content: space-between; height: 120px;'>
                <div>
                    <div class='kpi-title' style='color:#ff7043;'>Source Attribution</div>
                    <div style='font-size: 0.8rem; font-weight: bold; margin-top:5px; color:#ffffff;'>Biomass Burning</div>
                    <div style='font-size: 1.3rem; font-weight: bold; color: #ff7043;'>{int(biomass)}%</div>
                </div>
                <div style='font-size: 0.75rem; color:#8b949e;'>View Details →</div>
            </div>
            """, unsafe_allow_html=True)
        with col_c_right:
            st.plotly_chart(fig_donut, use_container_width=True)
            
    # Card 5: Model Confidence
    with b_c5:
        spark_conf = [85, 87, 86, 88, 89, 89, 89]
        st.markdown(f"""
        <div class='bottom-card'>
            <div>
                <div class='kpi-title' style='color:#00e676;'>Model Confidence</div>
                <div class='kpi-value' style='font-size: 2.2rem; color:#00e676;'>89%</div>
                <div style='font-size:0.7rem; color:#00e676;'>High Confidence</div>
            </div>
            {generate_sparkline_svg(spark_conf, "#00e676")}
            <div style='font-size: 0.75rem; color:#8b949e;'>View Details →</div>
        </div>
        """, unsafe_allow_html=True)

    # 5. Footer Bar
    st.markdown("---")
    f_left, f_right = st.columns([1.2, 0.8])
    with f_left:
        st.markdown("""
        <div style='font-size: 0.75rem; color: #526385; display: flex; gap: 15px;'>
            <span><b>Data Sources:</b></span>
            <span>📡 Sentinel-5P</span>
            <span>📡 MODIS</span>
            <span>📡 VIIRS</span>
            <span>📡 ERA5</span>
            <span>📡 CPCB</span>
            <span>☁️ Google Earth Engine</span>
        </div>
        """, unsafe_allow_html=True)
    with f_right:
        st.markdown("""
        <div style='font-size: 0.75rem; color: #526385; text-align: right;'>
            VayuDrishti Platform v1.0.0 | <span style='color: #00e676;'>●</span> System Online
        </div>
        """, unsafe_allow_html=True)

# ==================== OTHER SECTION ROUTING (Tab Views) ====================
elif nav_page == "🗺️ Live Map":
    st.markdown("### 🗺️ Spatiotemporal GIS Observatory Map")
    m = folium.Map(location=[focus_lat, focus_lon], zoom_start=8, tiles="cartodbpositron")
    for idx, r in day_df.iterrows():
        color, cat = get_cpcb_color_and_label(r["aqi"])
        folium.CircleMarker(
            location=[r["latitude"], r["longitude"]],
            radius=12,
            color=color,
            fill=True,
            fill_color=color,
            fill_opacity=0.6,
            stroke=False,
            popup=f"AQI: {r['aqi']} ({cat})"
        ).add_to(m)
    st_folium(m, width="100%", height=650, returned_objects=[])

elif nav_page == "🔮 AQI Forecast":
    st.markdown("### 🔮 Proactive 48-Hour AQI Forecast Panel")
    if delhi_data is not None:
        f_temp = [delhi_data["temperature"] - 0.5, delhi_data["temperature"] - 1.0]
        f_blh = [max(180.0, delhi_data["blh"] - 30.0), max(180.0, delhi_data["blh"] - 60.0)]
        f_wind_u = [delhi_data["wind_u"] * 1.1, delhi_data["wind_u"] * 1.2]
        f_wind_v = [delhi_data["wind_v"] * 1.1, delhi_data["wind_v"] * 1.2]
        
        from models.aqi_model import FEATURES
        forecast_rows = []
        for i in range(2):
            row_copy = delhi_data[FEATURES].copy()
            row_copy["temperature"] = f_temp[i]
            row_copy["blh"] = f_blh[i]
            row_copy["wind_u"] = f_wind_u[i]
            row_copy["wind_v"] = f_wind_v[i]
            forecast_rows.append(row_copy)
            
        forecast_df = pd.DataFrame(forecast_rows)
        predicted_forecast = model_manager.predict_grid(forecast_df)
        
        st.markdown(f"#### 48-Hour Projections for {selected_district}:")
        c1, c2 = st.columns(2)
        for i, col in enumerate([c1, c2]):
            f_aqi = predicted_forecast["aqi"].iloc[i]
            f_color, f_category = get_cpcb_color_and_label(f_aqi)
            with col:
                st.markdown(f"""
                <div class='glass-card' style='text-align: center;'>
                    <h3>Day +{i+1} AQI Forecast</h3>
                    <h1 style='color: {f_color}; font-size: 3.5rem;'>{int(f_aqi)}</h1>
                    <h4 style='color: {f_color};'>{f_category}</h4>
                    <p style='color: #8b949e;'>Estimated boundary layer height: {int(f_blh[i])} m</p>
                </div>
                """, unsafe_allow_html=True)

elif nav_page == "🧬 HCHO Hotspots":
    st.markdown("### 🧬 HCHO DBSCAN Hotspot Detection")
    st.caption("Active hotspot clusters detected via spatial density clustering on TROPOMI Formaldehyde column values.")
    st.dataframe(day_hotspots[day_hotspots["is_hotspot"]][["date", "district", "state", "hcho_column", "is_biomass_driven"]].reset_index(drop=True), use_container_width=True)

elif nav_page == "🔥 Fire Detection":
    st.markdown("### 🔥 NASA FIRMS Active Fire Observations")
    st.dataframe(day_fires[["latitude", "longitude", "frp", "confidence", "sensor"]].sort_values("frp", ascending=False).reset_index(drop=True), use_container_width=True)

elif nav_page == "💨 Wind Transport":
    st.markdown("### 💨 Plume Trajectory Dispersion Analysis")
    lag_results, merged_ts = transport.analyze_lagged_impact(grid_df, fires_df, upwind_state="Punjab", downwind_district="Delhi")
    st.markdown("#### Time-Lagged Cross-Correlation Coefficients:")
    st.dataframe(lag_results, use_container_width=True)

elif nav_page == "🏷️ Source Attribution":
    st.markdown("### 🏷️ Chemical Source Attribution Diagnostics")
    st.caption("Emissions parsed based on gas chemistry ratios (HCHO:NO₂:CO:SO₂).")
    attributed_day = grid_df[grid_df["date"] == selected_date]
    st.dataframe(attributed_day[["district", "state", "source_biomass_pct", "source_vehicular_pct", "source_industrial_pct"]].reset_index(drop=True), use_container_width=True)

elif nav_page == "🏙️ District Analytics":
    st.markdown("### 🏙️ focus District Analytics Panel")
    district_averages = grid_df.groupby("district")["aqi"].mean().reset_index().sort_values("aqi", ascending=False)
    fig_comp = px.bar(district_averages, x="aqi", y="district", orientation="h", title="Average estimated AQI across October-November 2025")
    st.plotly_chart(fig_comp, use_container_width=True)

elif nav_page == "📋 Reports":
    st.markdown("### 📋 National Clean Air Programme (NCAP) Compliance Exporter")
    csv = grid_df.to_csv(index=False).encode('utf-8')
    st.download_button(
        label="Download Full 30-Day compliance CSV Report",
        data=csv,
        file_name=f"NCAP_Compliance_Report_India_{selected_date}.csv",
        mime="text/csv",
        use_container_width=True
    )

elif nav_page == "🔔 Alerts":
    st.markdown("### 🔔 Spatial Health-Risk Alerts")
    st.info("No critical health alerts active. Sensitive groups should restrict exposure in districts with AQI > 200.")

elif nav_page == "🗂️ Data Explorer":
    st.markdown("### 🗂️ Grid Data Explorer")
    st.dataframe(grid_df.head(200), use_container_width=True)

elif nav_page == "⚙️ Settings":
    st.markdown("### ⚙️ Platform Parameters & Configuration")
    st.slider("DBSCAN Neighborhood Radius (eps in degrees)", 0.1, 1.0, 0.3)
    st.slider("HCHO Hotspot Anomaly Percentile Threshold", 50, 99, 85)
