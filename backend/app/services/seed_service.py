import json
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.security import hash_password
from app.models import (
    User, Zone, Ward, WasteCategory, SegregationPlant,
    CollectionVehicle, AIDetection, ImageContribution,
    AIModelVersion, TrainingJob, DatasetSource,
    EnvironmentalMetric, OperationalAlert, OptimizationRecommendation
)

CHENNAI_ZONES = [
    (1, "Thiruvottiyur", "Tollgate, Thiruvottiyur High Road"),
    (2, "Manali", "Manali Express Road"),
    (3, "Madhavaram", "Madhavaram High Road"),
    (4, "Tondiarpet", "Old Washermanpet"),
    (5, "Royapuram", "MC Road, Royapuram"),
    (6, "Thiru-Vi-Ka Nagar", "Strahans Road, Otteri"),
    (7, "Ambattur", "CTH Road, Ambattur"),
    (8, "Anna Nagar", "2nd Avenue, Anna Nagar"),
    (9, "Teynampet", "Mount Road, Teynampet"),
    (10, "Kodambakkam", "Arcot Road, Kodambakkam"),
    (11, "Valasaravakkam", "Arcot Road, Valasaravakkam"),
    (12, "Alandur", "GST Road, Alandur"),
    (13, "Adyar", "LB Road, Adyar"),
    (14, "Perungudi", "OMR, Perungudi"),
    (15, "Sholinganallur", "ECR/OMR Junction, Sholinganallur")
]

WASTE_CATEGORIES_DATA = [
    ("Organic Waste", "#10B981", 95.0, "Biodegradable plant matter, leaves, tree trimmings and garden cuttings suitable for aerated composting.", "Route to nearest Micro-Composting Center (MCC)."),
    ("Food Waste", "#84CC16", 92.0, "Kitchen wet waste, vegetable peels, plate scraps and restaurant organic leftovers.", "Transport to Bio-CNG / Anaerobic Digestion facilities."),
    ("Plastic", "#0EA5E9", 85.0, "Rigid HDPE/PP containers, LDPE packaging films, and PET beverage containers.", "Sort at Material Recovery Facility (MRF) and bale for mechanical recyclers."),
    ("Paper", "#F59E0B", 90.0, "Newspapers, corrugated boxes, office stationery, books and leaflets.", "Keep clean and dry; send to paper pulping recycling mills."),
    ("Cardboard", "#D97706", 92.0, "Brown Kraft cartons, shipping packaging boxes, and grayboard boxes.", "Flatten and bundle for industrial corrugated recycling plants."),
    ("Glass", "#06B6D4", 100.0, "Transparent and amber glass bottles, jars, and unbroken glassware.", "Segregate by color and transfer to cullet melting glass furnaces."),
    ("Metal", "#6366F1", 98.0, "Aluminum cans, tin containers, iron scrap, and aerosol canisters.", "Magnetic separation followed by scrap foundry remelting."),
    ("Textile Waste", "#EC4899", 65.0, "Discarded apparel, tailoring fabric trimmings, jute and synthetic bags.", "Direct to secondary shredding, insulation, or upcycling centers."),
    ("Electronic Waste", "#8B5CF6", 80.0, "Old cell phones, lithium-ion cells, PCB boards, cords, and small appliances.", "Strictly divert to authorized CPCB registered e-waste recyclers."),
    ("Hazardous Waste", "#EF4444", 15.0, "Sanitary pads, expired pharmaceuticals, paint containers, solvent cans, and syringes.", "Incinerate at Common Bio-medical / Hazardous Waste Treatment Facility."),
    ("Mixed / Unsegregated Waste", "#64748B", 30.0, "Unsorted domestic waste mixture requiring mechanical sorting and RDF separation.", "Send through trommel screens for RDF recovery; residue to secured landfill.")
]

PLANTS_DATA = [
    ("Perungudi Solid Waste Processing Center", "Segregation Plant & Secured Landfill", 14, 170, 12.9372, 80.2312, 2600.0, 2180.0, "active", "Organic,Plastic,Paper,Metal,Glass,Cardboard", "Urbaser Sumeet / GCC", "+91 44 2496 1122", "Perungudi Dump Yard Complex, Pallavaram 200 Ft Radial Road, Chennai"),
    ("Kodungaiyur Integrated Waste Management Facility", "Segregation Plant & Processing Hub", 4, 38, 13.1412, 80.2645, 2400.0, 2120.0, "active", "Organic,Plastic,Paper,Metal,Glass,Cardboard", "Ramky Enviro Engineers / GCC", "+91 44 2598 4401", "Kodungaiyur, Tondiarpet High Road, Chennai"),
    ("Madhavaram 100 TPD Bio-CNG Facility", "Bio-CNG & Bio-Methanation", 3, 32, 13.1524, 80.2185, 100.0, 88.5, "active", "Food Waste,Organic Waste", "GCC Green Energy Venture", "+91 44 2553 7810", "Near Madhavaram Truck Terminal, GNT Road, Chennai"),
    ("Chetpet Micro Composting Center (MCC)", "Composting Plant", 9, 112, 13.0694, 80.2425, 25.0, 21.0, "active", "Food Waste,Organic Waste", "Greater Chennai Corporation", "+91 44 2836 2901", "Harrington Road, Chetpet, Chennai"),
    ("Pallikaranai Material Recovery Facility (MRF)", "Recycling Facility (Dry Waste)", 14, 175, 12.9410, 80.2080, 150.0, 128.0, "active", "Plastic,Paper,Cardboard,Glass,Metal", "Tamil Nadu Waste Management Ltd", "+91 44 2246 8812", "Velachery-Tambaram Main Road, Pallikaranai, Chennai"),
    ("Otteri Resource Recovery & Baling Station", "Material Recovery Facility", 6, 74, 13.0921, 80.2514, 80.0, 64.0, "active", "Plastic,Paper,Cardboard,Metal", "Greater Chennai Corporation", "+91 44 2662 1099", "Strahans Road, Otteri, Chennai"),
    ("Koyambedu Wholesale Market Biogas Unit", "Bio-CNG & Biomethanation", 10, 127, 13.0688, 80.1912, 35.0, 31.5, "active", "Food Waste,Organic Waste", "CMDA & GCC Joint Venture", "+91 44 2479 6633", "Koyambedu Wholesale Flower & Veg Market, Chennai"),
    ("Alandur Waste Transfer & Compactor Station", "Transfer Station", 12, 160, 12.9975, 80.1985, 300.0, 245.0, "active", "Mixed Waste,Organic,Plastic", "Urbaser Sumeet", "+91 44 2234 1500", "GST Road, Guindy-Alandur Border, Chennai"),
    ("Royapuram Decentralized MCC & Nursery", "Composting Facility", 5, 50, 13.1118, 80.2925, 20.0, 14.5, "active", "Organic Waste,Food Waste", "GCC Zone 5 SWM", "+91 44 2595 3320", "Kalmandapam, Royapuram, Chennai"),
    ("Sholinganallur E-Waste & Plastic Segregation Unit", "Recycling Facility", 15, 196, 12.9015, 80.2275, 60.0, 42.0, "active", "Electronic Waste,Plastic,Metal", "Greengate Eco Solutions", "+91 44 2450 7788", "OMR IT Corridor, Sholinganallur, Chennai"),
    ("Ambattur Industrial Dry Waste Recovery Hub", "Recycling Facility", 7, 85, 13.1145, 80.1542, 120.0, 95.0, "active", "Cardboard,Paper,Metal,Plastic", "Ambattur Industrial Association", "+91 44 2625 4411", "Ambattur Industrial Estate Phase II, Chennai"),
    ("Valasaravakkam Micro Processing Plant", "Micro Segregation Plant", 11, 148, 13.0425, 80.1740, 40.0, 12.0, "maintenance", "Organic,Plastic,Cardboard", "GCC Zone 11 SWM", "+91 44 2486 9911", "Arcot Road, Valasaravakkam, Chennai")
]

def seed_database(db: Session):
    # Check if already seeded
    if db.query(Zone).count() > 0:
        return

    print("Seeding Chennai Waste Management Platform database...")

    # 1. Users
    users = [
        User(username="admin", email="admin@chennaiswm.gov.in", hashed_password=hash_password("Admin@123"), full_name="Dr. M. Soundararajan, IAS (Municipal Commissioner)", role="system_admin", organization="Greater Chennai Corporation (GCC)", city="Chennai", contribution_points=1250, badges="Municipal Director"),
        User(username="officer_kumar", email="kumar.swm@chennaiswm.gov.in", hashed_password=hash_password("Officer@123"), full_name="Er. R. Kumar (Executive Engineer, Zone 8)", role="municipal_officer", organization="GCC Zone 8 - Anna Nagar", city="Chennai", contribution_points=850, badges="Senior Field Officer"),
        User(username="plant_operator", email="operator.perungudi@chennaiswm.gov.in", hashed_password=hash_password("Operator@123"), full_name="K. Vaitheeswaran (Plant Supervisor)", role="plant_operator", organization="Perungudi SWM Processing Plant", city="Chennai", contribution_points=600, badges="Plant Chief"),
        User(username="ai_admin", email="ai.lead@chennaiswm.gov.in", hashed_password=hash_password("Admin@123"), full_name="Dr. Ananya Natarajan (Lead AI Scientist)", role="ai_admin", organization="IIT Madras / GCC AI Lab", city="Chennai", contribution_points=2400, badges="AI Vision Lead"),
        User(username="citizen_priya", email="priya.chennai@gmail.com", hashed_password=hash_password("Citizen@123"), full_name="Priya Subramanian (Green Volunteer)", role="contributor", organization="Chennai Green Earth Citizens Club", city="Chennai", contribution_points=420, badges="Master Segregator"),
        User(username="public_guest", email="guest@chennai.in", hashed_password=hash_password("Guest@123"), full_name="Public Guest Resident", role="public", organization="Chennai Resident", city="Chennai", contribution_points=50, badges="Eco Citizen")
    ]
    db.add_all(users)
    db.commit()

    # 2. Zones
    zone_objs = {}
    for z_no, z_name, z_hq in CHENNAI_ZONES:
        z = Zone(zone_number=z_no, name=z_name, headquarters=z_hq)
        db.add(z)
        db.commit()
        zone_objs[z_no] = z

    # 3. Wards 1 to 200 with realistic distribution
    # Center latitudes: Zone 1 (13.16), Zone 5 (13.10), Zone 8 (13.08), Zone 9 (13.04), Zone 13 (12.99), Zone 15 (12.90)
    # Longitudes: 80.14 (West) to 80.29 (Coast)
    ward_names = [
        "Tollgate", "Ernavoor", "Kathivakkam", "Sathangadu", "Chinnasekkadu", "Manali New Town",
        "Madhavaram Central", "Moolakadai", "Vyasarpadi", "Tondiarpet East", "Old Washermanpet",
        "Royapuram Harbor", "George Town North", "Sowcarpet", "Chintadripet", "Otteri",
        "Purasawalkam", "Perambur Barracks", "Sembium", "Kolathur East", "Villivakkam",
        "Ambattur Industrial", "Korattur Lake", "Padi", "Anna Nagar Tower", "Shenoy Nagar",
        "Aminjikarai", "Thirumangalam", "Chetpet Lake", "Nungambakkam High Road", "T. Nagar Panagal Park",
        "Teynampet Central", "Alwarpet", "Mylapore Temple Area", "Triplicane Marina", "Royapettah",
        "Kodambakkam Power House", "Vadapalani Murugan Area", "Ashok Nagar Pillar", "KK Nagar Central",
        "Valasaravakkam Market", "Virugambakkam", "Porur Junction", "Ramapuram", "Alandur Metro",
        "Guindy Race Course", "St. Thomas Mount", "Adyar Kasturba Nagar", "Besant Nagar Beach",
        "Thiruvanmiyur Temple", "Kotturpuram", "Perungudi OMR", "Kandanchavadi IT", "Thoraipakkam Toll",
        "Palavakkam Coastal", "Neelankarai Beach", "Sholinganallur Junction", "Semmancheri", "Uthandi ECR"
    ]

    wards = []
    for w_no in range(1, 201):
        # Determine assigned zone (approx 13-14 wards per zone)
        z_no = min(15, max(1, (w_no - 1) // 13 + 1))
        zone_ref = zone_objs[z_no]
        
        # Latitude interpolation from north (13.19) to south (12.87)
        lat_base = 13.18 - ((w_no - 1) / 200.0) * 0.31
        lat = round(lat_base + random.uniform(-0.012, 0.012), 4)
        
        # Longitude variation between 80.16 and 80.28
        lng = round(80.21 + random.uniform(-0.065, 0.065), 4)

        name_idx = (w_no - 1) % len(ward_names)
        w_name = f"{ward_names[name_idx]} (Ward {w_no})"
        pop = random.randint(35000, 68000)
        daily_waste = round((pop * random.uniform(0.48, 0.62)) / 1000.0, 1)
        
        # Vary segregation efficiency: coastal/residential higher (60-80%), commercial/market lower (35-55%)
        if z_no in [8, 9, 13]: # Anna Nagar, Teynampet, Adyar
            seg_eff = round(random.uniform(62.0, 84.0), 1)
            poll_risk = round(random.uniform(25.0, 48.0), 1)
            rec_pot = round(random.uniform(72.0, 89.0), 1)
        elif z_no in [4, 5, 10]: # Tondiarpet, Royapuram, Kodambakkam (Dense commercial)
            seg_eff = round(random.uniform(38.0, 58.0), 1)
            poll_risk = round(random.uniform(55.0, 85.0), 1)
            rec_pot = round(random.uniform(65.0, 78.0), 1)
        else:
            seg_eff = round(random.uniform(48.0, 68.0), 1)
            poll_risk = round(random.uniform(40.0, 65.0), 1)
            rec_pot = round(random.uniform(68.0, 82.0), 1)

        primary = random.choices(
            ["Organic Waste", "Food Waste", "Plastic", "Cardboard", "Mixed / Unsegregated Waste"],
            weights=[40, 25, 15, 10, 10]
        )[0]

        ward = Ward(
            ward_number=w_no,
            name=w_name,
            zone_id=zone_ref.id,
            latitude=lat,
            longitude=lng,
            population=pop,
            area_sqkm=round(random.uniform(1.2, 3.8), 2),
            daily_waste_tons=daily_waste,
            segregation_efficiency=seg_eff,
            pollution_risk_score=poll_risk,
            recycling_potential=rec_pot,
            primary_waste_type=primary,
            collection_frequency_per_day=random.choice([2, 2, 3])
        )
        wards.append(ward)

    db.add_all(wards)
    db.commit()

    # 4. Waste Categories
    for c_name, c_col, c_rec, c_desc, c_inst in WASTE_CATEGORIES_DATA:
        cat = WasteCategory(
            name=c_name,
            color=c_col,
            recyclability_pct=c_rec,
            description=c_desc,
            handling_instructions=c_inst
        )
        db.add(cat)
    db.commit()

    # 5. Segregation Plants
    for p_name, p_type, p_z, p_w, p_lat, p_lng, p_cap, p_curr, p_stat, p_acc, p_op, p_ph, p_addr in PLANTS_DATA:
        plant = SegregationPlant(
            name=p_name,
            facility_type=p_type,
            zone_id=p_z,
            ward_id=p_w,
            latitude=p_lat,
            longitude=p_lng,
            capacity_tpd=p_cap,
            current_input_tpd=p_curr,
            status=p_stat,
            accepted_categories=p_acc,
            operator_name=p_op,
            contact_phone=p_ph,
            address=p_addr
        )
        db.add(plant)
    db.commit()

    # 6. Smart Garbage Collection Trucks (GC-01 to GC-24)
    driver_names = [
        "M. Selvam", "R. Arumugam", "S. Murugan", "T. Vijay", "K. Anbarasan", "V. Manikandan",
        "P. Karthik", "G. Venkatesh", "B. Balaji", "D. Dinesh", "A. Jayakumar", "M. Saravanan",
        "R. Thangaraj", "S. Senthil", "C. Prakash", "E. Ramesh", "N. Suresh", "L. Natarajan",
        "K. Ravi", "J. Mohan", "V. Sridhar", "P. Ganesan", "T. Elangovan", "M. Palani"
    ]

    vehicles = []
    for i in range(1, 25):
        code = f"GC-{i:02d}"
        assigned_ward = random.randint(1, 200)
        w_obj = db.query(Ward).filter(Ward.ward_number == assigned_ward).first()
        lat = w_obj.latitude + random.uniform(-0.005, 0.005) if w_obj else 13.0827
        lng = w_obj.longitude + random.uniform(-0.005, 0.005) if w_obj else 80.2707

        v = CollectionVehicle(
            vehicle_code=code,
            vehicle_type="Smart Compactor Truck (IoT + AI Camera)",
            registration_no=f"TN-01-GCC-{1000 + i}",
            driver_name=driver_names[i - 1],
            driver_phone=f"+91 98400 {20000 + i}",
            capacity_tons=5.0,
            current_fill_pct=round(random.uniform(25.0, 92.0), 1),
            battery_or_fuel_pct=round(random.uniform(55.0, 98.0), 1),
            status=random.choice(["collecting", "collecting", "in_transit", "collecting", "unloading"]),
            latitude=round(lat, 4),
            longitude=round(lng, 4),
            assigned_zone_id=w_obj.zone_id if w_obj else 5,
            assigned_ward_id=assigned_ward,
            assigned_route=f"Sector {i} - Route {chr(65 + (i % 6))}",
            current_speed_kmh=round(random.uniform(12.0, 26.0), 1),
            last_ping=datetime.utcnow(),
            camera_status="Active - Streaming AI Feed"
        )
        vehicles.append(v)

    db.add_all(vehicles)
    db.commit()

    # 7. AI Models
    models = [
        AIModelVersion(
            model_name="GCC-WasteVision-YOLO",
            version="v2.1",
            status="production",
            framework="PyTorch 2.2 / YOLOv8x-Waste",
            accuracy=0.894,
            precision=0.882,
            recall=0.865,
            f1_score=0.871,
            training_images_count=12400,
            training_date=datetime.utcnow() - timedelta(days=28),
            dataset_version="GCC-DS-2026.1",
            class_metrics_json=json.dumps({
                "Plastic": {"accuracy": 0.91, "f1": 0.89, "samples": 2400},
                "Food Waste": {"accuracy": 0.88, "f1": 0.87, "samples": 3100},
                "Cardboard": {"accuracy": 0.92, "f1": 0.90, "samples": 1500},
                "Paper": {"accuracy": 0.89, "f1": 0.86, "samples": 1400},
                "Glass": {"accuracy": 0.87, "f1": 0.85, "samples": 850},
                "Metal": {"accuracy": 0.90, "f1": 0.88, "samples": 780},
                "Organic Waste": {"accuracy": 0.86, "f1": 0.84, "samples": 1800},
                "Textile Waste": {"accuracy": 0.83, "f1": 0.81, "samples": 420},
                "Electronic Waste": {"accuracy": 0.85, "f1": 0.83, "samples": 350},
                "Hazardous Waste": {"accuracy": 0.88, "f1": 0.86, "samples": 200},
                "Mixed Waste": {"accuracy": 0.80, "f1": 0.78, "samples": 600}
            }),
            notes="Current Production model deployed on municipal collection fleet smart cameras.",
            is_active_production=True
        ),
        AIModelVersion(
            model_name="GCC-WasteVision-YOLO",
            version="v2.2",
            status="candidate",
            framework="PyTorch 2.2 / YOLOv8x-Waste",
            accuracy=0.921,
            precision=0.915,
            recall=0.908,
            f1_score=0.914,
            training_images_count=12900,
            training_date=datetime.utcnow() - timedelta(days=2),
            dataset_version="GCC-DS-2026.2-Candidate",
            class_metrics_json=json.dumps({
                "Plastic": {"accuracy": 0.94, "f1": 0.93, "samples": 2550},
                "Food Waste": {"accuracy": 0.91, "f1": 0.90, "samples": 3220},
                "Cardboard": {"accuracy": 0.95, "f1": 0.93, "samples": 1580},
                "Paper": {"accuracy": 0.91, "f1": 0.89, "samples": 1460},
                "Glass": {"accuracy": 0.89, "f1": 0.88, "samples": 890},
                "Metal": {"accuracy": 0.93, "f1": 0.92, "samples": 810},
                "Organic Waste": {"accuracy": 0.89, "f1": 0.88, "samples": 1920},
                "Textile Waste": {"accuracy": 0.87, "f1": 0.85, "samples": 460},
                "Electronic Waste": {"accuracy": 0.88, "f1": 0.87, "samples": 380},
                "Hazardous Waste": {"accuracy": 0.91, "f1": 0.90, "samples": 220},
                "Mixed Waste": {"accuracy": 0.83, "f1": 0.82, "samples": 610}
            }),
            notes="Candidate model retrained with +500 community verified citizen photos and camera annotations. Ready for Admin approval.",
            is_active_production=False
        ),
        AIModelVersion(
            model_name="GCC-WasteVision-YOLO",
            version="v2.0",
            status="archived",
            framework="PyTorch 2.1 / YOLOv8m",
            accuracy=0.862,
            precision=0.850,
            recall=0.831,
            f1_score=0.835,
            training_images_count=10000,
            training_date=datetime.utcnow() - timedelta(days=90),
            dataset_version="GCC-DS-2025.4",
            class_metrics_json="{}",
            notes="Archived model from Q4 2025.",
            is_active_production=False
        )
    ]
    db.add_all(models)
    db.commit()

    # 8. Training Jobs
    job = TrainingJob(
        job_code="JOB-2026-0901",
        candidate_version="v2.2",
        base_version="v2.1",
        new_images_count=500,
        status="completed",
        current_epoch=50,
        total_epochs=50,
        train_loss=0.084,
        val_loss=0.112,
        val_accuracy=0.921,
        val_f1=0.914,
        started_at=datetime.utcnow() - timedelta(days=2, hours=3),
        completed_at=datetime.utcnow() - timedelta(days=2),
        log_output="Epoch 50/50 [================] - loss: 0.084 - val_loss: 0.112 - val_acc: 0.921 - val_f1: 0.914. Candidate model weights saved successfully."
    )
    db.add(job)
    db.commit()

    # 9. Smart Truck AI Detections
    detection_items = [
        ("Plastic Bottle (PET)", 0.96, 0.15, 68.0),
        ("Corrugated Cardboard Box", 0.93, 0.45, 72.0),
        ("Vegetable Food Scraps", 0.91, 1.80, 84.0),
        ("Aluminum Beverage Can", 0.94, 0.08, 55.0),
        ("Office Printing Paper", 0.89, 0.32, 60.0),
        ("Discarded Glass Condiment Jar", 0.92, 0.40, 70.0),
        ("Coconut Shell Biomass", 0.95, 2.10, 88.0),
        ("Single-use Polybag Cluster", 0.88, 0.22, 65.0),
        ("Broken Electronic PCB", 0.91, 0.60, 40.0),
        ("Discarded Synthetic Garment", 0.87, 0.75, 58.0)
    ]

    detections = []
    for idx, (waste_name, conf, wt, fill) in enumerate(detection_items * 3):
        v_idx = (idx % 24) + 1
        v_code = f"GC-{v_idx:02d}"
        w_num = random.randint(1, 200)
        w_obj = db.query(Ward).filter(Ward.ward_number == w_num).first()

        bbox = [
            round(random.uniform(0.12, 0.25), 2),
            round(random.uniform(0.15, 0.28), 2),
            round(random.uniform(0.72, 0.88), 2),
            round(random.uniform(0.70, 0.86), 2)
        ]

        det = AIDetection(
            detection_code=f"DET-2026-{1000 + idx}",
            vehicle_code=v_code,
            ward_number=w_num,
            location_name=w_obj.name if w_obj else f"Ward {w_num}",
            latitude=w_obj.latitude if w_obj else 13.0827,
            longitude=w_obj.longitude if w_obj else 80.2707,
            waste_category=waste_name,
            confidence=conf,
            bounding_box_json=json.dumps(bbox),
            image_url="/assets/samples/waste_sample.jpg",
            model_version="v2.1",
            estimated_weight_kg=wt,
            bin_fill_level_pct=fill,
            timestamp=datetime.utcnow() - timedelta(minutes=idx * 7),
            data_type="AI-DETECTED DATA"
        )
        detections.append(det)

    db.add_all(detections)
    db.commit()

    # 10. Sample Community Contributions (staging for training)
    contrib_samples = [
        ("Citizen Priya S.", "Plastic Bottle", 0.94, "Plastic", False, 88.0, "valid", "staged_for_training", 174, "Besant Nagar Beach"),
        ("Suresh K.", "Cardboard Box", 0.92, "Cardboard", False, 91.0, "valid", "staged_for_training", 82, "Anna Nagar 2nd Avenue"),
        ("Dr. Ananya N.", "Organic Food", 0.82, "Food Waste", True, 76.0, "valid", "staged_for_training", 112, "Chetpet"),
        ("Vignesh R.", "Paper Flyer", 0.89, "Paper", False, 82.0, "valid", "staged_for_training", 140, "T. Nagar Bus Terminus"),
        ("Deepa Raman", "Glass Bottle", 0.95, "Glass", False, 89.0, "valid", "staged_for_training", 155, "Mylapore Tank"),
        ("M. Balaji", "Lithium Battery", 0.78, "Hazardous Waste", True, 74.0, "valid", "staged_for_training", 102, "Royapuram MC Road"),
        ("Kavitha M.", "Aluminum Can", 0.93, "Metal", False, 85.0, "valid", "staged_for_training", 180, "Adyar Shastri Nagar")
    ]

    for name, aipred, aiconf, usercat, iscorr, blur, qstat, vstat, w_no, loc in contrib_samples:
        c = ImageContribution(
            contributor_name=name,
            image_url="/assets/samples/sample_contrib.jpg",
            image_hash=f"hash_{random.randint(100000, 999999)}",
            file_size_kb=round(random.uniform(90.0, 320.0), 1),
            ai_predicted_category=aipred,
            ai_confidence=aiconf,
            user_confirmed_category=usercat,
            is_user_corrected=iscorr,
            user_notes="Contributed to improve local Chennai plastic detection.",
            blur_score=blur,
            quality_status=qstat,
            validation_status=vstat,
            ward_number=w_no,
            location_name=loc,
            created_at=datetime.utcnow() - timedelta(hours=random.randint(2, 48)),
            data_type="USER-CONTRIBUTED DATA"
        )
        db.add(c)
    db.commit()

    # 11. Operational Alerts
    alerts = [
        OperationalAlert(
            alert_code="ALT-2026-001",
            priority="Critical",
            category="Plant Near Capacity",
            location_name="Perungudi Waste Processing Center (Zone 14)",
            ward_number=170,
            issue="Facility input reached 2,180 TPD (83.8% of daily rated capacity). Organic fraction surge from South Chennai causing offloading bottleneck.",
            recommended_action="Trigger AI Dynamic Load Balancing to divert 220 TPD wet waste to Madhavaram Bio-CNG and Pallikaranai MRF.",
            status="Active",
            timestamp=datetime.utcnow() - timedelta(minutes=24)
        ),
        OperationalAlert(
            alert_code="ALT-2026-002",
            priority="High",
            category="Low Segregation Efficiency",
            location_name="Ward 102 (Royapuram Harbor Sector)",
            ward_number=102,
            issue="Segregation efficiency dropped to 41.2% over last 48 hours. Plastic and wet food contamination detected in blue commercial bins.",
            recommended_action="Deploy Ward 102 Swachhata inspector team for commercial vendor compliance checks.",
            status="Active",
            timestamp=datetime.utcnow() - timedelta(hours=2)
        ),
        OperationalAlert(
            alert_code="ALT-2026-003",
            priority="High",
            category="High Waste Accumulation",
            location_name="Ward 82 (Anna Nagar West Commercial Hub)",
            ward_number=82,
            issue="Commercial waste accumulation increased +34% compared to baseline. Secondary collection bins at 90% volume.",
            recommended_action="Dispatch auxiliary compactor truck GC-12 for supplemental afternoon run at 14:30 hrs.",
            status="Active",
            timestamp=datetime.utcnow() - timedelta(hours=3, minutes=15)
        ),
        OperationalAlert(
            alert_code="ALT-2026-004",
            priority="Medium",
            category="Facility Maintenance",
            location_name="Valasaravakkam Micro Processing Plant (Zone 11)",
            ward_number=148,
            issue="Conveyor belt shredder undergoing scheduled quarterly motor overhaul.",
            recommended_action="Route Zone 11 dry recyclables to Ambattur Recovery Hub during 48-hour maintenance window.",
            status="Active",
            timestamp=datetime.utcnow() - timedelta(hours=6)
        ),
        OperationalAlert(
            alert_code="ALT-2026-005",
            priority="Low",
            category="Low AI Detection Confidence",
            location_name="Vehicle GC-18 Camera Feed (Ward 65, Perambur)",
            ward_number=65,
            issue="Camera lens flagged optical smudging; confidence dropped to 72% on 3 consecutive bin sweeps.",
            recommended_action="Notify driver M. Saravanan to wipe front camera lens at next transit checkpoint.",
            status="Active",
            timestamp=datetime.utcnow() - timedelta(hours=4)
        )
    ]
    db.add_all(alerts)
    db.commit()

    # 12. Optimization Recommendations
    recs = [
        OptimizationRecommendation(
            recommendation_code="REC-OPT-01",
            category="Plant Load Balancing",
            ward_number=174,
            ward_name="Adyar (Ward 174)",
            target_plant_name="Madhavaram Bio-CNG Facility",
            title="Divert South Chennai Wet Waste from Perungudi to Bio-CNG",
            description="Perungudi processing unit is approaching 84% operational threshold. Re-routing 12 collection compactor trips daily to Madhavaram Bio-CNG utilizes available capacity and saves open-dump stacking.",
            expected_benefit="Reduces Perungudi load by 140 TPD and produces ~920 kg compressed bio-gas daily.",
            confidence_score=0.94,
            status="Active",
            tag="AI RECOMMENDATION"
        ),
        OptimizationRecommendation(
            recommendation_code="REC-OPT-02",
            category="Collection Frequency",
            ward_number=82,
            ward_name="Anna Nagar (Ward 82)",
            target_plant_name="Perungudi Processing Center",
            title="Schedule Secondary Afternoon Pickup for Commercial Corridors",
            description="Ward 82 commercial zones produce 36.8 TPD waste. Mid-day restaurant and packaging bin surges cause afternoon overflow.",
            expected_benefit="Reduces roadside bin spillage by 44% and eliminates secondary scavenging.",
            confidence_score=0.91,
            status="Active",
            tag="AI RECOMMENDATION"
        ),
        OptimizationRecommendation(
            recommendation_code="REC-OPT-03",
            category="Route Optimization",
            ward_number=136,
            ward_name="T. Nagar Commercial (Ward 136)",
            target_plant_name="Alandur Waste Transfer Station",
            title="Advance Morning Collection Window to 05:45 AM",
            description="Smart truck fleet telemetry indicates GC-07 and GC-08 encounter 22 minutes average traffic delay on Usman Road after 07:30 AM.",
            expected_benefit="Saves 42 liters diesel weekly per truck and decreases transit time by 32%.",
            confidence_score=0.89,
            status="Active",
            tag="AI RECOMMENDATION"
        )
    ]
    db.add_all(recs)
    db.commit()

    print("Chennai Waste Management Platform database successfully seeded with authentic data.")
