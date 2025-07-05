-- Clean Amenities System Migration
-- إعادة بناء نظام الـ amenities بشكل نظيف ومبسط

-- حذف جميع البيانات الموجودة في جدول amenities
DELETE FROM amenities;

-- إعادة تعيين تسلسل الـ ID (إذا كان يستخدم)
-- ALTER SEQUENCE amenities_id_seq RESTART WITH 1;

-- إدراج الـ amenities الجديدة بالنظام المبسط (3 فئات فقط)

-- الأساسيات (Essential)
INSERT INTO amenities (id, name, category, icon) VALUES 
  ('wifi', 'Wi-Fi', 'essential', 'Wifi'),
  ('kitchen', 'Kitchen', 'essential', 'ChefHat'),
  ('air_conditioning', 'Air Conditioning', 'essential', 'ThermometerSnowflake'),
  ('parking', 'Free Parking', 'essential', 'Car'),
  ('security', 'Security', 'essential', 'Shield'),
  ('heating', 'Heating', 'essential', 'ThermometerSnowflake'),
  ('washing_machine', 'Washing Machine', 'essential', 'Wind'),
  ('private_entrance', 'Private Entrance', 'essential', 'Shield'),
  ('elevator', 'Elevator', 'essential', 'Wind'),
  ('workspace', 'Workspace', 'essential', 'Wind');

-- الراحة (Comfort)
INSERT INTO amenities (id, name, category, icon) VALUES 
  ('balcony', 'Balcony', 'comfort', 'Wind'),
  ('pool', 'Swimming Pool', 'comfort', 'Waves'),
  ('dining_area', 'Dining Area', 'comfort', 'UtensilsCrossed'),
  ('garden', 'Garden', 'comfort', 'Wind'),
  ('terrace', 'Terrace', 'comfort', 'Wind'),
  ('spa', 'Spa', 'comfort', 'Wind'),
  ('gym', 'Gym', 'comfort', 'Wind'),
  ('sauna', 'Sauna', 'comfort', 'Wind'),
  ('hot_tub', 'Hot Tub', 'comfort', 'Waves'),
  ('ocean_view', 'Ocean View', 'comfort', 'Wind'),
  ('mountain_view', 'Mountain View', 'comfort', 'Wind'),
  ('city_view', 'City View', 'comfort', 'Wind'),
  ('fireplace', 'Fireplace', 'comfort', 'Wind'),
  ('closet', 'Closet', 'comfort', 'Wind'),
  ('iron', 'Iron', 'comfort', 'Wind');

-- الترفيه (Entertainment)
INSERT INTO amenities (id, name, category, icon) VALUES 
  ('tv', 'TV', 'entertainment', 'Tv2'),
  ('gaming', 'Gaming Console', 'entertainment', 'GamepadIcon'),
  ('netflix', 'Netflix', 'entertainment', 'Tv2'),
  ('sound_system', 'Sound System', 'entertainment', 'GamepadIcon'),
  ('books', 'Books', 'entertainment', 'GamepadIcon'),
  ('board_games', 'Board Games', 'entertainment', 'GamepadIcon'),
  ('music_instruments', 'Music Instruments', 'entertainment', 'GamepadIcon'),
  ('outdoor_games', 'Outdoor Games', 'entertainment', 'GamepadIcon'),
  ('bbq', 'BBQ Grill', 'entertainment', 'UtensilsCrossed'),
  ('beach_access', 'Beach Access', 'entertainment', 'Waves'),
  ('water_sports', 'Water Sports Equipment', 'entertainment', 'Waves'),
  ('bicycles', 'Bicycles', 'entertainment', 'GamepadIcon');

-- تنظيف جدول property_amenities من العلاقات غير الصحيحة
-- حذف أي amenity_id لا يوجد في جدول amenities الجديد
DELETE FROM property_amenities 
WHERE amenity_id NOT IN (
  SELECT id FROM amenities
);

-- إضافة تعليق على الجداول
COMMENT ON TABLE amenities IS 'Simplified amenities system with 3 categories: essential, comfort, entertainment';
COMMENT ON COLUMN amenities.category IS 'Category: essential, comfort, or entertainment';
COMMENT ON COLUMN amenities.icon IS 'Lucide React icon name';

-- إنشاء فهرس على category للبحث السريع
CREATE INDEX IF NOT EXISTS idx_amenities_category ON amenities(category);

-- إضافة constraint للتأكد من صحة الفئات
ALTER TABLE amenities 
ADD CONSTRAINT check_amenities_category 
CHECK (category IN ('essential', 'comfort', 'entertainment')); 