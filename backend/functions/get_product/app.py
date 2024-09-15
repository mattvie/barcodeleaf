import re
import json
import boto3
import traceback
import simplejson as json

offTable = boto3.resource('dynamodb').Table('openfoodfacts')

def lambda_handler(event, context):
    """Get product details from DynamoDB database."""    
    try:
        barcode = event.get('pathParameters', {}).get('barcode')
        if barcode is None:
            raise Exception("Barcode is required")
        
        result = offTable.get_item(
            Key={'PK': str(barcode)}
        )
        if "Item" not in result:
            raise Exception("Product not found")
        product = result['Item']
        
        body = {attr.removesuffix("_100g"): val if not attr.endswith("_100g") else float(val) for attr, val in product.items()}
        
    except Exception as exc:
        traceback.print_exc()   
        return {
            "statusCode": 400,
            "headers": headers, 
            'body': str(exc)
        }
    
    return {
        "statusCode": 200,
        "headers": headers,
        'body': json.dumps(body)
    }

headers = {
    'Access-Control-Allow-Origin': '*',
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    'Access-Control-Allow-Headers': 'Content-Type'
}