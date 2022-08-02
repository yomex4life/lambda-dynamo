import { Stack, StackProps, SecretValue } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Pipeline, Artifact } from "aws-cdk-lib/aws-codepipeline";
import { GitHubSourceAction, CodeBuildAction } from "aws-cdk-lib/aws-codepipeline-actions";
import { PipelineProject, LinuxBuildImage, BuildSpec } from "aws-cdk-lib/aws-codebuild";

export class LambdaDynamoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);


    const pipeline = new Pipeline(this, 'MyFirstPipeline', {
      pipelineName: 'MyPipeline',
      crossAccountKeys: false
    });

    const sourceOutput = new Artifact('SourceOutput');


    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new GitHubSourceAction({
          owner: 'yomex4life',
          repo: 'aws-pipeline',
          branch: 'master',
          actionName: 'Pipeline_Source',
          oauthToken: SecretValue.secretsManager('github-pipeline-token'),
          output: sourceOutput
        })
      ]
    });

    const cdkBuildOutput = new Artifact('cdkBuildOutput');

    pipeline.addStage({
      stageName: "Build",
      actions: [new CodeBuildAction({
        actionName: "CDK_build",
        input: sourceOutput,
        outputs: [cdkBuildOutput],
        project: new PipelineProject(this, 'CdkBuildProject', {
          environment: {
            buildImage: LinuxBuildImage.STANDARD_6_0
          },
          buildSpec:BuildSpec.fromSourceFilename('build-specs/cdk-build-spec.yml')
        })
      })]
    });
  }
}