import boto3
import traceback
import simplejson as json
import heapq
from boto3.dynamodb.types import TypeDeserializer

dynamoDeserialize = TypeDeserializer().deserialize

# sam local invoke search -e events/event_test_search.json

dynamoClient = boto3.client('dynamodb')
offTable = boto3.resource('dynamodb').Table('openfoodfacts')
params = ["product_name", "PK"]


def jaro_distance(s1: str, s2: str) -> float:
    if s1 == s2:
        return 1.0 
 
    len_s1, len_s2 = len(s1), len(s2)
    if len_s1 == 0 or len_s2 == 0:
        return 0.0
    
    match_distance = max(len_s1, len_s2) // 2 - 1

    common_chars_s1 = []
    common_chars_s2 = []

    for i, char in enumerate(s1):
        start = max(0, i - match_distance)
        end = min(i + match_distance + 1, len_s2)

        if char in s2[start:end]:
            common_chars_s1.append(char)
            common_chars_s2.append(s2[start:end][s2[start:end].index(char)])

    m = len(common_chars_s1)
    if m == 0:
        return 0.0

    transpositions = sum(c1 != c2 for c1, c2 in zip(common_chars_s1, common_chars_s2)) // 2
    return (m / len_s1 + m / len_s2 + (m - transpositions) / m) / 3

def jaro_Winkler(s1:str, s2:str, P:float=0.1, threshold:float=0.6) -> float: 
    # Sw = Sj + P * L * (1 – Sj) 
    jaro_dist = jaro_distance(s1, s2)
    if (jaro_dist < threshold):
        return 0

    prefix_len = 0
    max_prefix = 7
    for i in range(min(len(s1), len(s2))):
        if (s1[i] == s2[i]):
            prefix_len += 1
        else:
            break
        if prefix_len == max_prefix:
            break
    return jaro_dist + P * prefix_len * (1 - jaro_dist) 

def get_close_matches(query:str, possible_values: list[str], n:int=10, cutoff:float=0.6):
    possible_matches = {}
    for val in possible_values:
        possible_matches[val] = jaro_Winkler(query, val, threshold=cutoff)
    return heapq.nlargest(n, possible_matches, key=possible_matches.get)


def lambda_handler(event, context):
    """Get product details from openfoodfects API."""
    try:
        search = event.get('queryStringParameters', {}).get('search')
        if search is None:
            raise Exception("Search is required")

        result = offTable.scan(
            ProjectionExpression=", ".join(params)
        )
        if "Items" not in result:
            raise Exception("No products found")

        products = {item['product_name']: item for item in result.get('Items') if 'product_name' in item}
        lastEvaluatedKey = result.get('LastEvaluatedKey')
        while lastEvaluatedKey is not None:
            result = offTable.scan(
                ExclusiveStartKey=lastEvaluatedKey,
                ProjectionExpression=", ".join(params)
            )
            products.update({item['product_name']: item for item in result.get('Items') if 'product_name' in item})
            lastEvaluatedKey = result.get('LastEvaluatedKey')
            
        matches = get_close_matches(search, list(products.keys()), n=10, cutoff=0.6)
        matchedProducts = [products[product_name] for product_name in matches]
        
        respose = dynamoClient.batch_get_item(RequestItems={
            'openfoodfacts': {
                'Keys': [{
                    "PK": {"S": product["PK"]}
                } for product in matchedProducts]
            }
        }).get('Responses', {}).get('openfoodfacts', [])
        body = [dynamoDeserialize({"M": item}) for item in respose]

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
