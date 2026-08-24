import type { EnvVisitor } from '@webiai/sdk.infra/util/stack-env';

/**
 * Environment schema for the SrvApi stack.
 */
export interface SrvApiEnv {
  local: boolean;
  aws: {
    region: string;
  };
}

/**
 * Visitor that transforms raw env vars into typed schema.
 *
 * Receives merged variables from: process.env → app-level SSM → stack-level SSM.
 */
export const srvApiEnvVisitor: EnvVisitor<SrvApiEnv> = (env) => ({
  local: env.SST_LOCAL?.optional.bool() ?? false,
  aws: {
    region: env.AWS_REGION?.optional.string() ?? 'us-east-1',
  },
});
