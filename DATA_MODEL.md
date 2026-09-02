# Data model cible

Tables/concepts :

## workspaces
id, name, created_at

## workspace_members
workspace_id, user_id, role(owner/admin/member), status

## company_profiles
workspace_id, legal_name, trade_name, address, city, region, postal_code, country, phone, email, tax_number, language, units, currency, reference_format

## businesses
workspace_id, name, tax_number, email, phone, roles[]

## business_sites
workspace_id, business_id, name, address, city, region, postal_code, country, opening_time, closing_time, dock_info, flatbed_required, appointment_required, call_before_minutes, notes

## contacts
workspace_id, business_id, site_id, name, role, email, phone, extension, contact_type

## products
workspace_id, name, part_number, descriptions, weight, dimensions, default_package_type, stackable, default_value, currency, active

## product_customs
workspace_id, product_id, destination_country, hs_code, hts_code, official_description, country_of_origin, source_name, revision, effective_date, validation_status, validated_by, validated_at

## carriers
workspace_id, name, carrier_type, email, phone, default_provides_bol, notes

## brokers
workspace_id, name, contact_name, email, phone, address, is_default_usa

## shipments
workspace_id, reference, shipment_date, destination_country, reason, language, status, created_by

## shipment_parties
shipment_id, party_type, snapshot_json

## shipment_items
shipment_id, product_id nullable, product_snapshot_json, name, part_number, quantity, weight, dimensions, package_type, lot_number, serial_numbers, container_reference, release_note_reference, unit_value, currency, hs_code, hts_code, origin_country

## shipment_packages
shipment_id, package_number, package_count, package_type, weight, length, width, height, stackable, destination_label

## shipment_references
shipment_id, type(PO/SO/PROJECT/COST_CENTER/RMA/LOT/CONTAINER/RELEASE_NOTE/OTHER), value

## shipment_transport
shipment_id, carrier_id, carrier_snapshot_json, pro_number, bol_number, payment_term, third_party_snapshot_json, needs_bol

## source_documents
workspace_id, shipment_id nullable, storage_path, mime_type, original_filename, uploaded_by

## document_extractions
source_document_id, raw_result_json, normalized_result_json, validation_status, confirmed_by, confirmed_at

## generated_documents
workspace_id, shipment_id, document_type, template_version, storage_path, generated_at, generated_by

## shipment_audit_log
workspace_id, shipment_id, actor_user_id, action, metadata_json, created_at
