import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunctionProps, NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class LambdaDynamoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const productTable = new Table(this, 'product', {
      partitionKey: {name: 'id', type: AttributeType.STRING},
      tableName: 'product',
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST
    });

    const nodeJsProductFunctionProps: NodejsFunctionProps = {
      bundling: {
      externalModules: [
          'aws-sdk'
      ]
      },
      environment: {
          PRIMARY_KEY: 'id',
          DYNAMODB_TABLE_NAME: productTable.tableName,
      },
      runtime: Runtime.NODEJS_16_X
    } 

    const productFunction = new NodejsFunction(this, 'product-lambda-function', {
      entry: join(__dirname, `/../src/product/index.js`),
      ...nodeJsProductFunctionProps
    });

    productTable.grantReadWriteData(productFunction);

    const api = new LambdaRestApi(this, 'product-api',{
      restApiName: 'Product Service',
      handler: productFunction,
      proxy: false
    });

    api.root.addMethod('ANY');
    const books = api.root.addResource('product');
    books.addMethod('GET');
    books.addMethod('POST');
  }
}
