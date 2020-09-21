const AWS = require("aws-sdk");
const Joi = require("joi");
const status = require("http-status");
const uuid = require('uuid');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const schema = Joi.object({
  templateName: Joi.string().alphanum().min(3).max(30).required(),
  messageText: Joi.string().min(3).max(30).required(),
  userId: Joi.string().alphanum().required(),
});

function CreateTemplate(event, context, callback) {
  const inputData = JSON.parse(event.body);
  const validation = schema.validate(inputData);
  if (validation.errors != null) {
    callback(null, {
      statusCode: status.BAD_REQUEST,
      headers: { "Content-Type": "text/plan" },
      body: "The data input was incorrect",
    });
    return;
  }

  const params = {
    TableName: 'Templates',
    Item: {
      template_id: uuid.v1(),
      templateName: inputData.templateName,
      messageText: inputData.messageText,
      user_id: inputData.userId
    }
  }
  dynamoDb.put(params, (error) => {
    if(error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: { 'Content-Type': 'text/plain'},
        body: `Couldn't create the template item`
      });
      return;
    }
  
    const response = {
      statusCode: 200,
      body: JSON.stringify(params.Item)
    };
    callback(null, response);
  });
};

function EditTemplate(event, context, callback) {
  const inputData = JSON.parse(even.body);
  const validation = schema.validate(inputData);
  if (validation.errors != null) {
    callback(null, {
      statusCode: status.BAD_REQUEST,
      headers: { "Content-Type": "text/plan" },
      body: "The data input was incorrect",
    });
    return;
  }

  const params = {
    TableName: 'Templates',
    Key: {
      user_id: event.pathParameters.user_id,
      template_id: event.pathParameters.template_id
    },
    UpdateExpression: 'Set messageText = :text, templateName = :templateName',
    ExpressionAttributeValues: {
      ':messageText': data.messageText,
      ':templateName': data.templateName
    },
    ReturnValues: 'ALL_NEW'
  };

  dynamoDb.update(params, (error, result) => {
    if(error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Couldn\'t update the todo item.',
      });
      return;
    }

    const response = {
      statusCode: status.OK,
      body: JSON.string(result.attributes)
    };

    callback(null, response);
  });
}

function DeleteTemplate(event, context, callback) {
  const params = {
    TableName: 'Templates',
    Key: {
      user_id: event.pathParameters.user_id,
      template_id: event.pathParameters.template_id
    }
  };

  dynamoDb.delete(params, (error) => {
    if(error) {
      console.error(error);

      callback(null, {
        statusCode: error.statusCode || 501,
        headers: { 'Content-Type': 'text/plain'},
        body: `Couldn't remove the template`
      });
      return;
    }

    const response = {
      statusCode: status.OK,
      body: JSON.stringify({})
    }

    callback(null, response);
  });
}

function GetTemplate(event, context, callback) {
  const params = {
    TableName: 'Templates',
    Key: {
      user_id: event.pathParameters.user_id,
      template_id: event.pathParameters.template_id,
    },
  };

  dynamoDb.get(params, (error, result) => {
    if(error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Couldn\'t fetch the template.',
      });
    }

    const response = {
      statusCode: status.OK,
      body: JSON.stringify(result.Item)
    };
    callback(null, response);
  });
}

function ListTemplates(event, context, callback) {
  const params = {
    TableName: 'Templates',
    KeyConditionExpression: 'user_id = :user_id',
    ExpressionAttributeValues: {
      ':user_id': event.pathParameters.user_id
    }
  };

  dynamoDb.query(params, function(error, result) {
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Couldn\'t fetch the todos.',
      });
      return;
    }

    const response = {
      statusCode: 200,
      body: JSON.stringify(result.Items)
    };

    callback(null, response);
  });
}


module.exports.create = CreateTemplate;
module.exports.edit = EditTemplate;
module.exports.delete = DeleteTemplate;
module.exports.get = GetTemplate;
module.exports.list = ListTemplates;