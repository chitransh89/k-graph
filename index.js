import { resolve } from 'path';
import exampleRoute from './server/routes/example';

export default function (kibana) {
  return new kibana.Plugin({
    require: ['elasticsearch'],
    name: 'k-graph',
    uiExports: {
      
      app: {
        title: 'K Graph',
        description: 'Play with graph',
        main: 'plugins/k-graph/app',
		icon: 'plugins/k-graph/graph.svg'
      },
      
      
      translations: [
        resolve(__dirname, './translations/es.json')
      ],
      
      
    },

    config(Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
      }).default();
    },

    
    init(server, options) {
      // Add server routes and initialize the plugin here
      exampleRoute(server);
    }
    

  });
};
