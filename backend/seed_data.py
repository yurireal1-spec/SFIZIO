from app.db.session import SessionLocal, engine
from app import models
from app.models.base import Base

def seed_db():
    # Cria as tabelas se elas não existirem (essencial para SQLite)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # 1. Criar Categorias
    cat_sofas = models.Category(
        name="Sofás Living", 
        slug="sofas-living", 
        description="Conforto e sofisticação para salas de estar exclusivas."
    )
    cat_mesas = models.Category(
        name="Mesas de Jantar", 
        slug="mesas-de-jantar", 
        description="Design contemporâneo para encontros memoráveis."
    )
    cat_poltronas = models.Category(
        name="Poltronas de Autor", 
        slug="poltronas-de-autor", 
        description="Peças icônicas que assinam o ambiente."
    )
    
    db.add_all([cat_sofas, cat_mesas, cat_poltronas])
    db.commit()
    
    # 2. Criar Produtos Exemplo
    p1 = models.Product(
        name="Sofá Nuage Curvo",
        slug="sofa-nuage-curvo",
        description="Com formas orgânicas e revestimento em bouclé italiano, o Sofá Nuage é a definição de fluidez e elegância.",
        price=18500.00,
        stock=5,
        category_id=cat_sofas.id
    )
    
    p2 = models.Product(
        name="Mesa Pietra Mármore",
        slug="mesa-pietra-marmore",
        description="Tampo em mármore Calacatta com base em bronze escovado. Uma peça escultural para salas de jantar premium.",
        price=24900.00,
        stock=2,
        category_id=cat_mesas.id
    )
    
    p3 = models.Product(
        name="Poltrona Gaia",
        slug="poltrona-gaia",
        description="Design assinado com estrutura em nogueira maciça e couro legítimo envelhecido manualmente.",
        price=8900.00,
        discount_price=7500.00,
        stock=10,
        category_id=cat_poltronas.id
    )
    
    db.add_all([p1, p2, p3])
    db.commit()
    
    # 3. Adicionar uma imagem para cada (simuladas)
    img1 = models.ProductImage(product_id=p1.id, url="https://images.unsplash.com/photo-1555041469-a586c61ea9bc", is_primary=True)
    img2 = models.ProductImage(product_id=p2.id, url="https://images.unsplash.com/photo-1577140917170-285929fb55b7", is_primary=True)
    img3 = models.ProductImage(product_id=p3.id, url="https://images.unsplash.com/photo-1598191383441-1f427ad44410", is_primary=True)
    
    db.add_all([img1, img2, img3])
    db.commit()

    # 4. Adicionar Opções (Tecidos, Cores, Metais)
    # Sofá Nuage - Opção de Tecido
    opt_tecido = models.ProductOption(product_id=p1.id, name="Tecido")
    db.add(opt_tecido)
    db.commit()
    
    val_boucle_off = models.ProductOptionValue(option_id=opt_tecido.id, name="Bouclé Off-White", meta="#f5f5f5")
    val_boucle_cinza = models.ProductOptionValue(option_id=opt_tecido.id, name="Bouclé Cinza Luna", meta="#d1d1d1")
    val_veludo_sage = models.ProductOptionValue(option_id=opt_tecido.id, name="Veludo Sage", meta="#b2bcaf", price_modifier=1500.0)
    
    # Mesa Pietra - Opção de Tampo
    opt_tampo = models.ProductOption(product_id=p2.id, name="Mármore do Tampo")
    db.add(opt_tampo)
    db.commit()
    
    val_calacatta = models.ProductOptionValue(option_id=opt_tampo.id, name="Calacatta Oro", meta="#ffffff")
    val_nero = models.ProductOptionValue(option_id=opt_tampo.id, name="Nero Marquina", meta="#1a1a1a", price_modifier=2000.0)
    
    # Poltrona Gaia - Opção de Couro
    opt_couro = models.ProductOption(product_id=p3.id, name="Revestimento")
    db.add(opt_couro)
    db.commit()
    
    val_couro_mel = models.ProductOptionValue(option_id=opt_couro.id, name="Couro Natural Mel", meta="#c68a53")
    val_couro_cafe = models.ProductOptionValue(option_id=opt_couro.id, name="Couro Café", meta="#4b3621")
    
    # Adicionando Materiais de Suporte
    # Sofá Nuage - Pés
    opt_pes_sofa = models.ProductOption(product_id=p1.id, name="Base / Pés")
    db.add(opt_pes_sofa)
    db.commit()
    val_pes_latonado = models.ProductOptionValue(option_id=opt_pes_sofa.id, name="Latão Escovado", meta="#d4af37")
    val_pes_madeira = models.ProductOptionValue(option_id=opt_pes_sofa.id, name="Nogueira Maciça", meta="#5d4037")

    # Mesa Pietra - Base
    opt_base_mesa = models.ProductOption(product_id=p2.id, name="Acabamento da Base")
    db.add(opt_base_mesa)
    db.commit()
    val_base_bronze = models.ProductOptionValue(option_id=opt_base_mesa.id, name="Bronze Champagne", meta="#b87333")
    val_base_preto = models.ProductOptionValue(option_id=opt_base_mesa.id, name="Preto Carbono", meta="#121212")

    # Poltrona Gaia - Madeira
    opt_madeira_polt = models.ProductOption(product_id=p3.id, name="Madeira da Estrutura")
    db.add(opt_madeira_polt)
    db.commit()
    val_madeira_natural = models.ProductOptionValue(option_id=opt_madeira_polt.id, name="Nogueira Natural", meta="#8d6e63")
    val_madeira_ebanizada = models.ProductOptionValue(option_id=opt_madeira_polt.id, name="Carvalho Ebanizado", meta="#212121")

    db.add_all([
        val_boucle_off, val_boucle_cinza, val_veludo_sage, 
        val_calacatta, val_nero, 
        val_couro_mel, val_couro_cafe,
        val_pes_latonado, val_pes_madeira,
        val_base_bronze, val_base_preto,
        val_madeira_natural, val_madeira_ebanizada
    ])
    db.commit()

    print("Banco de dados populado com sucesso!")
    db.close()

if __name__ == "__main__":
    seed_db()
