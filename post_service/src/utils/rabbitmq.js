const amqp = require('amqplib');
const logger = require('./logger.js');

let connection = null;
let channel = null;

const EXCHANGE_NAME = 'social_media_events'

async function connectRabbitMQ(){
    try{
        connection = await amqp.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();

        await channel.assertExchange(EXCHANGE_NAME, 'topic', {durable : false})
        logger.info('Conected to RabbitMQ');
        return channel;


    }catch(e){
        logger.error('Error connecting to RabbitMQ', e);
        res.status(400).json({
            success : false,
            message : 'Error while connecting to RabbitMQ'
        })
    }
}


async function publishEvent(routingKey, message){
    if(!channel){
        await connectRabbitMQ()
    }
    channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(message)))
    logger.info(`Event published : ${routingKey}`)
}

module.exports = {connectRabbitMQ, publishEvent}